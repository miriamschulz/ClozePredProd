'''
This script provides a simple wrapper around whisper_transcriber.py
to allow execution in batches (here, for all recordings in one Latin list).

USAGE:
python whisper_transcriber.py <whisper_model> <FOLDER CONTAINING IN-DIRS>
<STRING TO FILTER FOR INPUT DIRS> <out_dir> <fileformat>

EXAMPLE:
python whisper_transcriber.py medium production_data/data_keep list1
       whisper_annotations webm
'''

import sys
import os
import subprocess

# Check if all necessary arguments are provided
if len(sys.argv) != 6:
    print(f"\nUSAGE:   " +
          f"{sys.argv[0]} model input_dir keyword output_dir file_format")
    print(f"EXAMPLE: "+
          f"{sys.argv[0]} medium ./data_keep/ list1 ./annotations/ webm\n")
    sys.exit(1)

model_size = sys.argv[1]
path_in = sys.argv[2]
keyword = sys.argv[3]
path_out = sys.argv[4]
file_format = sys.argv[5]

# Path to the folder

# Get all folder names containing the keyword
folders_with_keyword = [
    folder_name
    for folder_name in os.listdir(path_in)
    if os.path.isdir(os.path.join(path_in, folder_name)) and
       keyword in folder_name
]

# Define font colors to print to terminal
green_font = "\033[1;32m"
red_font = "\033[1;31m"
reset_color = "\033[0m"

n_folders = len(folders_with_keyword)
if n_folders > 0:
    print(f"{green_font}\nFound {n_folders} folders containing '{keyword}':" +
          f"{reset_color}\n")
else:
    print(f"{red_font}\nFound no folders containing the keyword '{keyword}'."+
          f"{reset_color}\n")
    sys.exit(1)

# Add the path to the folders
folders_with_keyword = sorted(folders_with_keyword)
folderpaths = [path_in + f for f in folders_with_keyword]

for f in folders_with_keyword:
    print(f"├── {f}")

print("\nSending folders to whisper for annotation...\n")

for p in folderpaths:

    command = ["python", "whisper_transcriber.py",
               model_size, p, path_out, file_format]

    # Call whisper trancription script
    try:
        subprocess.run(command, check=True)
        print(f"\n{green_font}Wrapper script executed successfully.{reset_color}\n")
    except subprocess.CalledProcessError as e:
        print(f"{red_font}Error executing script: {e}{reset_color}")
