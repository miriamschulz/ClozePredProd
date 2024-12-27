'''
Pseudorandomization script
Miriam Schulz
10 December 2024

ABOUT:
This script takes a folder with .csv files as input and creates
pseudo-random orders over the rows in each file in this folder.
The pseudorandomized orders are saved to new files with the same
name and the suffix "_pseudorandomized" in the same folder.

This script allows to generate several pseudorandom orders for each file,
depending on the value of n_randomizations (if n_randomizations > 1).
Each different order will be appended to the same file.
The output files' Group column indicates the number of each pseudorandom order.

The criteria for pseudorandomization must be specified in a file
named "pseudorandomization_constraints.txt" located in the same directory
as this script.

USAGE:
python pseudorandomize_many_orders.py <folder> <n_randomizations>

EXAMPLE:
python pseudorandomize_many_orders.py pcibex_lists 20
'''


import sys
import os
import pandas as pd
import numpy as np
import random


def read_constraints(filename):
    """
    Function that reads in a file specifying the constraints for
    pseudorandomization.
    The must be a text file named pseudorandomization_constraints.txt
    containing lines of the structure:
    Constraint <constraintname> <max_n>
    E.g.: Constraint Condition 2
    """
    if not os.path.isfile(filename):
        raise FileNotFoundError(
            f"\n\033[31mThe file '{filename}' needed to specify the "
            "constraints was not found in the current directory.\033[0m"
        )

    with open(filename, 'r') as file:
        constraints = {}
        for line in file:
            line = line.strip().split()
            if line[0] == "Constraint":
                constraints[line[1]] = int(line[2])

    return constraints


def pseudorandomize(df,
                    df_output,
                    constraints,
                    n=None,
                    max_depth=1000,
                    recursion_depth=0):
    """
    Recursive function that generates a pseudorandomized data frame
    according to diverse maximal repeptition criteria.

    Parameters:
    df (dataframe): The dataframe containing the items to be added.
    df_output (dataframe): The dataframe to which items should be appended.
    constraints (dict): A dictionary containing the name of the column on which
                        to apply a constraint as keys, and the constraint
                        specifications as values.
    n (int): number of items to be added to df_output from df. Default: n=None,
             in which case the number of rows in the data frame will be used.
    max_depth (int): maximum number of attempts to start pseudorandomization
                     from scratch (to avoid infinite loops).
    recursion_depth (int): counter for the current number of recursive function
                           calls (should always be initiated as 0).

    Returns:
    df_target (dataframe): The original df_output plus the newly added lines.
    """

    df_current = df.copy()
    df_target = df_output.copy()

    if n is None:
        n = len(df)

    j = 0

    while j < n:

        # Subset the available items
        eligible = df_current.copy()

        # Subset conditions
        for property, max_val in constraints.items():

            # Extract the last relevant values from the data frame and
            # filter out any empty strings:
            prev = df_target.loc[df_target[property].notna(), property]\
                            .tail(max_val).tolist()

            # Subset the set of eligible remaining items based on the above:
            if len(set(prev)) == 1 and len(prev) >= max_val:
                eligible = eligible[eligible[property] != prev[0]]

        # Restart if no eligible rows remain (or quit if limit reached)
        if eligible.empty:
            recursion_depth += 1
            if recursion_depth < max_depth:
                # print("No remaining rows. Starting from scratch. Round no: "
                #       f"{recursion_depth + 1}", end="\r")
                return pseudorandomize(df,
                                       df_output,
                                       constraints,
                                       n=n,
                                       max_depth=max_depth,
                                       recursion_depth=recursion_depth)
            else:
                sys.exit(
                    "\n\033[1;31mExceeded maximum recursion depth "
                    "without finding a solution. Exiting function.\033[0m\n"
                )

        # Shuffle the chosen items, but make reproducible with a random seed
        current_seed = random.randint(1, 1234) - 1
        eligible = eligible.sample(frac=1, random_state = current_seed)\
            .reset_index(drop=True)

        # Append the first row to the dataframe
        df_target = pd.concat([df_target, eligible.iloc[[0]]],ignore_index=True)
        df_current = df_current[~df_current["ItemNum"]\
                        .isin(df_target["ItemNum"])]

        j += 1

        # Print in blue if recursion < 100, otherwise red
        font_color = "\033[1;34m" if recursion_depth < 100-1 else "\033[1;31m"

        print("Pseudorandomization attempt no:   "
              f"{font_color}{recursion_depth + 1}\033[0m", end="\r")

    return df_target



if __name__ == "__main__":

    ### Preliminaries ###

    # Set random seed
    random.seed(42)

    try:
        directory = sys.argv[1]
        n_randomizations = int(sys.argv[2])
    except:
        sys.exit("Usage: python pseudorandomize.py <folder> <n_randomizations>")

    constraints = read_constraints("pseudorandomization_constraints.txt")

    files = sorted(os.listdir(directory))
    files = [f for f in files if f.lower().endswith(".csv")
             and not "pseudorandomized" in f]

    for f, filename in enumerate(files):

        filepath = os.path.join(directory, filename)

        # Remove the output file if it already exists
        out_filepath = filepath.replace(".csv", "_pseudorandomized.csv")
        if os.path.exists(out_filepath):
            os.remove(out_filepath)

        print(f"\nPROCESSING FILE: {filename} (file no {f+1} / {len(files)})")

        # Generate r different random orders in each file
        for r in range(0, n_randomizations):

            current_group = r+1

            # Open file
            df = pd.read_csv(filepath)

            df["Group"] = current_group

            # Replace the empty string in the HasQuestion and Answer columns
            # to avoid running into NA issues later:
            df["HasQuestion"] = ["No" if pd.isna(x) else x
                                 for x in df["HasQuestion"]]


            ### Step 1: Select a first filler ###

            # question_fillers = df[(df["Type"].str.contains("Filler")) &
            #                       (df["HasQuestion"] == "Yes")]
            all_fillers = df[(df["Type"].str.contains("Filler"))]
            # Sample the same first filler per block for every list
            # achieved by using the random state.
            # CAREFUL: This is necessary to ensure reproducibility of the script!!!
            df_output = all_fillers.sample(1, random_state=42)
            df = df[~df["ItemNum"].isin(df_output["ItemNum"])]  # remove from df


            ### Step 2: Select one more filler to start the block ###

            constraints_start = {"ExpCondition": 1, # different conditions each time
                                 "Type": 3, # irrelevant but needs to be >= n here
                                 "HasQuestion": 1, # vary if second filler has Q
                                 "Answer": 2}  # irrelevant here
            n = 1  # 1 filler
            max_depth = 10

            fillers = df[df["Type"].str.contains("Filler")]

            df_output = pseudorandomize(fillers,
                                        df_output,
                                        constraints_start,
                                        n=n,
                                        max_depth=max_depth)
            df = df[~df["ItemNum"].isin(df_output["ItemNum"])]  # remove from df


            ### Step 3: Distribute the remaining items ###

            n = len(df)
            max_depth = 500

            df_output = pseudorandomize(df,
                                        df_output,
                                        constraints,
                                        n=n,
                                        max_depth=max_depth)
            df = df[~df["ItemNum"].isin(df_output["ItemNum"])]  # remove from df

            print(f"\n\033[1;38;5;22mFinished pseudorandomizing {filename}, order no {current_group}.\033[0m")

            # Save to CSV
            file_exists = os.path.exists(out_filepath)  # check if file exists
            df_output.to_csv(out_filepath, index=False, mode='a', header=not file_exists)


    print("\nAll files were successfully pseudorandomized.\n")
