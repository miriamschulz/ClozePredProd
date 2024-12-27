'''
Pseudorandomization script
Miriam Schulz
10 December 2024

ABOUT:
This script takes a list of one or more files as input and creates a
pseudo-random order over the rows in this file.
The output is the pseudorandomized file.

The criteria for pseudorandomization must be specified in a file
named "pseudorandomization_constraints.txt" located in the same directory.

USAGE:
python pseudorandomize.py <input files>

EXAMPLE:
python pseudorandomize.py comprehension_l1.csv comprehension_l2.csv
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


def pseudorandomize(df, df_output,
                    constraints,
                    n=None,
                    max_depth=1000, recursion_depth=0):
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
                print(f"No remaining rows. Starting from scratch. Round no: \
                {recursion_depth + 1}", end="\r")
                return pseudorandomize(df, df_output,
                                       constraints,
                                       n=n,
                                       max_depth=max_depth,
                                       recursion_depth=recursion_depth)
            else:
                sys.exit(
                    "\n\033[31mExceeded maximum recursion depth "
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

    return df_target



if __name__ == "__main__":


    ### Preliminaries ###

    # Set random seed
    random.seed(42)

    file_names = sys.argv[1:]
    if not len(file_names) > 0:
        sys.exit("Usage: python pseudorandomize.py <input files>")

    constraints = read_constraints("pseudorandomization_constraints.txt")

    for f in file_names:

        print("\nPROCESSING FILE: {}".format(f))

        df = pd.read_csv(f)

        # Replace the empty string in the HasQuestion and Answer columns
        # to avoid running into NA issues later:
        df["HasQuestion"] = ["No" if pd.isna(x) else x
                             for x in df["HasQuestion"]]

        ### Step 1: Select a first filler with a question ###

        question_fillers = df[(df["Type"].str.contains("Filler")) &
                              (df["HasQuestion"] == "Yes")]
        df_output = question_fillers.sample(1, random_state=42)
        df = df[~df["ItemNum"].isin(df_output["ItemNum"])]  # remove from df


        ### Step 2: Select two more fillers to start the block ###

        #TODO: adapt script to allow the start of a block
        # with some fillers, and then the full pseudorandomization
        constraints_start = {"ExpCondition": 1, # different conditions each time
                             "Type": 3, # irrelevant here but needs to be >= n here
                             "HasQuestion": 2,
                             "Answer": 2}
        n = 2
        max_depth = 5

        fillers = df[df["Type"].str.contains("Filler")]

        df_output = pseudorandomize(fillers, df_output,
                                    constraints_start,
                                    n=n, max_depth=max_depth)
        df = df[~df["ItemNum"].isin(df_output["ItemNum"])]  # remove from df


        ### Step 3: Distribute the remaining items ###

        n = len(df)
        max_depth = 500

        df_output = pseudorandomize(df, df_output,
                                    constraints,
                                    n=n, max_depth=max_depth)
        df = df[~df["ItemNum"].isin(df_output["ItemNum"])]  # remove from df

        print(
              "\n\033[38;5;22mFinished processing file {}. "
              "Writing to file.\033[0m".format(f)
        )

        # Save to CSV
        out_filename = f.replace(".csv", "_pseudorandomized.csv")
        # df_output.to_csv("test_pseudorandomization.csv", index=False)
        df_output.to_csv(out_filename, index=False)

    print("\nAll files were successfully pseudorandomized.\n")
