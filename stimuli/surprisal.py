import sys
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
from huggingface_hub import login



def chunkstring(string, length):
    return (list(string[0+i:length+i] for i in range(0, len(string), length)))

#def BPE_split(word):
#    encoded_w = tokenizer.encode(word) # type: list
#    return 1 if len(encoded_w)>2 else 0 # needs to be >2 because secret gpt2 will append </s> id to every encoding

def get_surprisal(seq):
    max_input_size = int(0.75*8000)
    seq_chunks = chunkstring(seq.split(),max_input_size)
    words, surprisals = [] , []

    for seq in seq_chunks:
        seq = ["<|endoftext|>"] + seq  # pre-pend a BOS token to avoid offset by one!
        story_tokens, story_token_surprisal = [] , []
        inputs = tokenizer(seq, is_split_into_words=True)
        model_inputs = transformers.BatchEncoding({"input_ids":torch.tensor(inputs.input_ids).unsqueeze(0),
            "attention_mask":torch.tensor(inputs.attention_mask).unsqueeze(0)})

        with torch.no_grad():
            outputs = model(**model_inputs)

        output_ids = model_inputs.input_ids.squeeze(0)[1:]
        tokens = tokenizer.convert_ids_to_tokens(model_inputs.input_ids.squeeze(0))[1:]
        index = torch.arange(0, output_ids.shape[0])
        #surp = -1 * torch.log2(F.softmax(outputs.logits, dim = -1).squeeze(0)[index, output_ids])  # equivalent to below..
        logits = outputs.logits.squeeze(0)
        surp = -1 * torch.log2(F.softmax(logits, dim=-1)[index, output_ids])

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

    # Print progress:
    #print(words)
    #print(surprisals)
    #print(probs)
    if len(surprisals) >= 6:
        target_surprisal = surprisals[5]
        print(f'Target: {words[5]}, Surprisal: {str(round(target_surprisal, 4))}')
    else:
        target_surprisal = None

    surprisals = " ".join(map(str, surprisals))
    probs = " ".join(map(str, probs))

    return surprisals, target_surprisal, probs   # surprisals[-1]


def get_surprisal_llama(seq):
    max_input_size = int(0.75 * 8000)
    seq_chunks = chunkstring(seq.split(), max_input_size)
    words, surprisals = [], []

    for seq in seq_chunks:
        # Convert the list of words back into a single string
        seq_str = " ".join(seq)

        story_tokens, story_token_surprisal = [], []
        inputs = tokenizer(seq_str)

        # Ensure offset_mapping is handled safely
        if 'offset_mapping' in inputs.keys():
            offsets = inputs['offset_mapping']
        else:
            offsets = None

        model_inputs = transformers.BatchEncoding({
            "input_ids": torch.tensor(inputs.input_ids).unsqueeze(0),
            "attention_mask": torch.tensor(inputs.attention_mask).unsqueeze(0)
        })

        with torch.no_grad():
            outputs = model(**model_inputs)

        output_ids = model_inputs.input_ids.squeeze(0)[1:]
        logits = outputs.logits.squeeze(0)
        index = torch.arange(0, output_ids.shape[0])

        # Calculate token surprisals
        surp = -1 * torch.log2(F.softmax(logits, dim=-1)[index, output_ids])

        # Directly handle word-token mapping (no offsets in LLaMA tokenizer)
        tokens = tokenizer.convert_ids_to_tokens(model_inputs.input_ids.squeeze(0).tolist())[1:]  # skip start token
        token_surprisals = surp.tolist()

        temp_token = ""
        temp_surprisal = 0

        for i, token in enumerate(tokens):
            temp_token += token  # Build the word from subword tokens
            temp_surprisal += token_surprisals[i]

            # Check if this token is the last in the current word
            if i == len(tokens) - 1 or tokens[i + 1].startswith('Ġ') or tokens[i + 1].startswith('▁'):
                # Remove subword boundary markers and save the word
                words.append(temp_token.lstrip("Ġ").lstrip("▁"))
                surprisals.append(temp_surprisal)
                temp_surprisal = 0
                temp_token = ""

    # Convert surprisals to probabilities
    probs = [1 / (2 ** s) for s in surprisals]

    # Print progress:
    #print("Words:", words)
    #print("Surprisals:", surprisals)
    if len(surprisals) >= 6:
        target_surprisal = surprisals[5]
        print(f'Target: {words[5]}, Surprisal: {str(round(target_surprisal, 5))}')
    else:
        target_surprisal = None

    surprisals = " ".join(map(str, surprisals))
    probs = " ".join(map(str, probs))

    return surprisals, target_surprisal, probs


def get_surprisal_file(model, chosen_model, filename):
    df = pd.read_csv(filename, sep=',', encoding='utf-8')
    if not 'llama' in chosen_model:
        df[['Surprisals', 'TargetSurprisal', 'Probs']] = pd.DataFrame(df['FullSentence'].apply(get_surprisal).tolist(), index=df.index)
    else:
        df[['Surprisals', 'TargetSurprisal', 'Probs']] = pd.DataFrame(df['FullSentence'].apply(get_surprisal_llama).tolist(), index=df.index)
    #df['surprisal'] = df['FullSentence'].apply(get_surprisal)
    #df['BPE_split'] = df['FullSentence'].apply(BPE_split)
    out_filename = f'{filename.rstrip('.csv')}_surprisal_{chosen_model}.csv'
    print(f'\nWriting to file: {out_filename}')
    df.to_csv(out_filename,
              sep = ',', encoding = 'utf-8', index = False)
    return df


if __name__=='__main__':

    if len(sys.argv) != 3:
        print(f"\nUSAGE:   {sys.argv[0]} <model> <stimmuli file>")
        print(f"EXAMPLE: {sys.argv[0]} gpt2-large stimuli.csv\n")
        sys.exit(1)

    chosen_model = sys.argv[1].lower()
    filename = sys.argv[2]

    possible_models = ['gpt2-large', 'gpt-neo', 'llama']
    if not chosen_model in possible_models:
        print(f'Please enter one of the following models: {possible_models[0]}, {possible_models[1]} or {possible_models[2]}.')
        sys.exit(1)

    print('Loading model: ' + chosen_model + '...')

    if "neo" in chosen_model:
        model_name = 'EleutherAI/gpt-neo-2.7B'
        tokenizer = AutoTokenizer.from_pretrained(model_name, add_prefix_space=True)
        model = AutoModelForCausalLM.from_pretrained(model_name)
    elif "llama" in chosen_model:
        try:
            with open("access_token.txt", "r") as file:
                access_token = file.read().strip()
        except:
            print("Could not read Llama access token. Check that 'access_token.txt' is present in the working directory.")
            sys.exit(1)
        login(token = access_token)
        model_name = "meta-llama/Meta-Llama-3-8B"
        tokenizer = AutoTokenizer.from_pretrained(model_name, padding_side='left')
        model = AutoModelForCausalLM.from_pretrained(model_name) #, device_map="auto")
    else:
        model_name = 'openai-community/gpt2-large'
        tokenizer = AutoTokenizer.from_pretrained(model_name, add_prefix_space=True)
        model = AutoModelForCausalLM.from_pretrained(model_name)

    # Creating model and tokenizer instances
    #tokenizer = AutoTokenizer.from_pretrained(model_name, add_prefix_space=True)
    #model = AutoModelForCausalLM.from_pretrained(model_name)
    model.eval()

    get_surprisal_file(model, chosen_model, filename)

    print('Done')
