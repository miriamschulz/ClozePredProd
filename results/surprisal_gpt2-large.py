import os
import argparse
import numpy as np
import pandas as pd
import re
import math
import transformers
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import torch.nn.functional as F



def chunkstring(string, length):
    return (list(string[0+i:length+i] for i in range(0, len(string), length)))


def BPE_split(word):
    encoded_w = tokenizer.encode(word) # type: list
    return 1 if len(encoded_w)>2 else 0 # needs to be >2 because secret gpt2 will append </s> id to every encoding

def get_surprisal(seq):
    max_input_size = int(0.75*8000)
    seq_chunks = chunkstring(seq.split(),max_input_size)
    words, surprisals = [] , []

    for seq in seq_chunks:

        story_tokens, story_token_surprisal = [] , []
        inputs = tokenizer(seq, is_split_into_words=True)

        model_inputs = transformers.BatchEncoding({"input_ids":torch.tensor(inputs.input_ids).unsqueeze(0),
            "attention_mask":torch.tensor(inputs.attention_mask).unsqueeze(0)})

        with torch.no_grad():
            outputs = model(**model_inputs)

        output_ids = model_inputs.input_ids.squeeze(0)[1:]
        tokens = tokenizer.convert_ids_to_tokens(model_inputs.input_ids.squeeze(0))[1:]
        index = torch.arange(0, output_ids.shape[0])
        surp = -1 * torch.log2(F.softmax(outputs.logits, dim = -1).squeeze(0)[index, output_ids])

        story_tokens.extend(tokens)
        story_token_surprisal.extend(np.array(surp))

        # Word surprisal
        i = 0
        temp_token = ""
        temp_surprisal = 0

        while i <= len(story_tokens)-1:

            temp_token += story_tokens[i]
            temp_surprisal += story_token_surprisal[i]

            if i == len(story_tokens)-1 or tokens[i+1].startswith("Ġ"): # "_" # Unicode code point is not U+005F but U+2581
                # remove start-of-token indicator
                words.append(temp_token[1:])
                surprisals.append(temp_surprisal)
                # reset temp token/surprisal
                temp_surprisal = 0
                temp_token = ""
            i += 1

    # convert back surprisals into probs for later use
    probs = [1/(2**s) for s in surprisals]

    print(words[-1])
    print(surprisals[-1])
    print(probs)
    print(surprisals)

    return surprisals[-1]   # surprisals[-1]



def get_surprisal_file(model, filename):
    df = pd.read_csv(filename, sep=',', encoding='utf-8')
    df['gpt2-large_s'] = df['Sentence'].apply(get_surprisal)
    df['BPE_split'] = df['TargetWord'].apply(BPE_split)
    df.to_csv(f'./stimuli_mini_surprisals.csv',sep=';',encoding='utf-8',index=False)
    return df


if __name__=='__main__':

    model_name = 'openai-community/gpt2-large'  # or: NEO
    print('Loading model...')
    # Creating model and tokenizer instances
    tokenizer = AutoTokenizer.from_pretrained(model_name, add_prefix_space=True)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    model.eval()

    #if '7b' in model_name:
    #    m_param = '7b'
    #elif '13b' in model_name:
    #    m_param = '13b'
    #get_surprisal_all(m_param)
    filename = './stimuli_mini.csv'

    get_surprisal_file(model, filename)

    print('Done')
