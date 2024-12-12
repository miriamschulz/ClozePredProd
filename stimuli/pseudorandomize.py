'''
Pseudorandomization script
Miriam Schulz
10 December 2024

ABOUT:
This script takes a list of one or more files as input and creates a
pseudo-random order over the rows in this file.
The output is the pseudorandomized file.

Current criteria for pseudorandomization:
- Each file starts with 3 fillers (the first with a comprehension question).
- No more than 2 experimental types (fillers vs. items) can occur in a row.
- No more than 2 experimental conditions (e.g., High Expectancy items)
  can occur in a row).
- No more than 3 items in a row can have a comprehension question/no question.
- No more than 3 consecutive questions (irrespective of the number of
  intervening trials with no question in between) can have the same answer
  (true/false).

USAGE:
python pseudorandomize.py <input files>

EXAMPLE:
python pseudorandomize.py comprehension_l1.csv comprehension_l2.csv
'''


import pandas as pd
import numpy as np
import random
import sys


def pseudorandomize(df, df_output, n, timeout, max_cond, max_type,
                    max_q, max_response, z=0):
    """
    Recursive function that generates a pseudorandomized data frame
    according to diverse maximal repeptition criteria.

    Parameters:
    df (dataframe): The dataframe containing the items to be added.
    df_output (dataframe): The dataframe to which items should be appended.
    n (int): number of items to be added to df_output from df.
    timeout (int): maximum number of attempts to start pseudorandomization
                   from scratch (to avoid infinite loops)
    max_cond (int): Maximum n of times the same condition can appear in a row
    max_type (int): Maximum n of times the same type (item vs. filler)
                    can appear in a row
    max_q (int): Maximum n of times that an item with/without a comprehension
                 question can appear in a row
    max_response (int): Maximum n of times the same answer for the comprehension
                       questions can appear in a row
    z (int): counter for the number of function calls (since this is a
             recursive function, should be initiated as 0)

    Returns:
    df_target (dataframe): The original df_output plus the newly added lines.
    """

    df_current = df.copy()
    df_target = df_output.copy()

    j = 0

    while j < n:

        # Get N recent conditions, types, questions and answers
        prev_conds = df_target["ExpCondition"].tail(max_cond).tolist()
        prev_types = df_target["Type"].tail(max_type).tolist()
        prev_qs = df_target["HasQuestion"].tail(max_q).tolist()
        prev_responses = df_target["Answer"].loc[~df_target["Answer"]\
                         .eq("NoQ")].tail(max_response).tolist()

        # Subset the available items
        eligible = df_current.copy()

        # Subset conditions
        if len(set(prev_conds)) == 1 and len(prev_conds) >= max_cond:
            eligible = eligible[eligible["ExpCondition"] != prev_conds[0]]
        # Subset types
        if len(set(prev_types)) == 1 and len(prev_types) >= max_type:
            eligible = eligible[eligible["Type"] != prev_types[0]]
        # Subset questions
        if len(set(prev_qs)) == 1 and len(prev_qs) >= max_q:
            eligible = eligible[eligible["HasQuestion"] != prev_qs[0]]
        # Subset responses
        if len(set(prev_responses)) == 1 and len(prev_responses) >= max_response:
            eligible = eligible[eligible["Answer"] != prev_responses[0]]

        # Restart if no eligible rows remain (or quit if limit reached)
        if eligible.empty:
            z += 1
            if z < timeout:
                print(f"No remaining rows. Starting from scratch. Round no: {z + 1}", end="\r")
                return pseudorandomize(df, df_output, n, timeout, max_cond,
                                       max_type, max_q, max_response, z=z)
            else:
                print("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                sys.exit("Reached max timeout. Exiting function.")

        # Shuffle the chosen items, but make reproducible with a random seed
        current_seed = random.randint(1, 1234) - 1
        eligible = eligible.sample(frac=1, random_state = current_seed)\
            .reset_index(drop=True)

        # Append the first row to the dataframe
        df_target = pd.concat([df_target, eligible.iloc[[0]]],ignore_index=True)
        df_current = df_current[~df_current["ItemNum"]\
                        .isin(df_target["ItemNum"])]

        j += 1

    return df_target



if __name__ == "__main__":


    ### Preliminaries ###

    # Set random seed
    random.seed(42)

    file_names = sys.argv[1:]
    if not len(file_names) > 0:
        sys.exit("Usage: python pseudorandomize.py <input files>")

    for f in file_names:
        # Load the dataset
        # df = pd.read_csv("test_data.csv")
        # df = pd.read_csv("comprehension_l1.csv")

        print("\n########################################")
        print("# PROCESSING FILE {} #".format(f))

        df = pd.read_csv(f)

        # Replace the empty string in the HasQuestion and Answer columns
        # to avoid running into NA issues later:
        df["HasQuestion"] = ["No" if pd.isna(x) else x for x in df["HasQuestion"]]
        df["Answer"] = ["NoQ" if pd.isna(x) else x for x in df["Answer"]]

        ### Step 1: Select a first filler with a question ###

        question_fillers = df[(df["Type"].str.contains("Filler")) & (df["HasQuestion"] == "Yes")]
        df_output = question_fillers.sample(1, random_state=42)
        df = df[~df["ItemNum"].isin(df_output["ItemNum"])]  # remove from df


        ### Step 2: Select two more fillers to start the block ###

        # Define parameters
        n = 2
        timeout = 5
        max_cond = 1  # different conditions each time from previous
        max_type = 3  # irrelevant here but needs to be >= n
        max_q = 2
        max_response = 2

        fillers = df[df["Type"].str.contains("Filler")]

        df_output = pseudorandomize(fillers, df_output, n, timeout, max_cond, max_type, max_q, max_response)
        df = df[~df["ItemNum"].isin(df_output["ItemNum"])]  # remove from df


        ### Step 3: Distribute the remaining items ###

        n = len(df)
        timeout = 500
        max_cond = 2
        max_type = 2
        max_q = 3
        max_response = 3

        df_output = pseudorandomize(df, df_output, n, timeout, max_cond, max_type, max_q, max_response)
        df = df[~df["ItemNum"].isin(df_output["ItemNum"])]  # remove from df

        print("\nFinished processing file {}. Writing to file.".format(f))

        # Save to CSV
        out_filename = f.replace(".csv", "_pseudorandomized.csv")
        # df_output.to_csv("test_pseudorandomization.csv", index=False)
        df_output.to_csv(out_filename, index=False)

    print("\nAll files were successfully pseudorandomized.\n")
