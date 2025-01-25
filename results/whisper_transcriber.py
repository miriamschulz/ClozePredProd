'''
Whisper batch transcriber
for OpenAI's Whisper ASR
Available here: https://github.com/openai/whisper

Script by Miriam Schulz
3 July 2023

ABOUT:
This script loops over all audio files in a given directory
(.webm, .wav or .mp3), automatically transcribes the recordings using Whisper,
and outputs the transcripts as a single .csv file for each subject.

Subjects are extracted from the file names, which need to be of the format:
recorder_UniqueID_ItemNum_Condition.webm (or .wav or .mp3)

USAGE:
python whisper_transcriber.py <whisper_model> <in_dir> <out_dir> <fileformat>

EXAMPLE:
python whisper_transcriber.py medium recordings whisper_annotations webm
OR:
python whisper_transcriber.py small production_data/data_keep/list1_1op9c4
production_data/whisper_transcriptions webm
'''


import sys
import os
import glob
import whisper


# Define font colors to print to terminal
blue_font = "\033[1;34m"
green_font = "\033[1;32m"
red_font = "\033[1;31m"
reset_color = "\033[0m"

# Check if all necessary arguments are provided
if len(sys.argv) != 5:
    print(f"\nUSAGE:   {sys.argv[0]} model input_dir output_dir file_format")
    print(f"EXAMPLE: {sys.argv[0]} medium ./recordings/ ./annotations/ webm\n")
    sys.exit(1)

model_size = sys.argv[1]
path = sys.argv[2]
path_out = sys.argv[3]
file_format = sys.argv[4]

# Check if the input directory exists
if not os.path.exists(path):
    print(f"{red_font}Input directory '{path}' not found.",
          f"Please specify an exising input directory path.{reset_color}")
    sys.exit(1)

# Check if the output directory exists; if not, create it or throw error
if not os.path.exists(path_out):
    # os.makedirs(path_out)
    # print(f"{green_font}Output directory '{path_out}' not found.",
    #       f"Output directory {path_out} created.{reset_color}")
    print(f"{red_font}Output directory '{path_out}' not found.",
          f"Please specify an exising output directory path.{reset_color}")
    sys.exit(1)

print(f"\nLoading Whisper model: \"{model_size}\"...\n")
#model = whisper.load_model("medium")
model = whisper.load_model(model_size)

# Loop over all autio files in the specified directory
audio_files = sorted(glob.glob(path + f"/*.{file_format}"))
total = len(audio_files)

print(f"{green_font}Found {total} .{file_format} files to annotate.{reset_color}\n")
print("Starting transcriptions...\n")

# Initiate
results = []
subject_results = []
previous_subject = "none"

# Loop over all files
for i, file in enumerate(audio_files):

    # Check if there are matching files
    if glob.glob(file):

        # Exclude audiotest, practice and filler files:
        if (not 'filler' in file):  # exclude trials/subjects like this
            # and not 'test_recorder' in file):

            # Transcribe
            transcription = model.transcribe(file,
                                             language="English",
                                             fp16=False,
                                             word_timestamps=True)

            try:
                segments = transcription['segments'][0]

                # Extract transcription inforomation
                transcription_text = segments['text']
                speech_onset = segments['start']  # voice onset time

            # If annotation failed:
            except:
                transcription_text = 'NO TEXT DISCOVERED'
                speech_onset = 'NO ONSET DISCOVERED'

            # Extract trial information from filename
            filename = file.split('/')
            filename_original = filename[-1]
            filename = filename_original.removesuffix('.webm').split('_')
            subject = filename[1]
            item = filename[2]
            if not 'test_recorder' in file:
                cond = filename[3]
            else:
                subject = filename[2]
                item = '0'
                cond = filename[0]

            # print("Filename", filename_original)
            # print("Subject", subject)
            # print("Item", item)
            # print("Condition", cond)
            # continue

            # Write to file when moving to a new subject
            if subject != previous_subject and previous_subject != "none":
                print(f"\nWriting file for subject {previous_subject}.\n")
                outfilename = f"{path_out}/annotations_{previous_subject}.csv"
                with open(outfilename, 'w', encoding="utf8") as F:
                    F.write('\"UniqueID\",\"ItemNum\",\"Condition\",\"WhisperAnnotation\",\"SpeechOnset\",\"FilenameRecording\"\n')
                    for res in subject_results:
                        out_string = '","'.join(res)
                        out_string = '"' + out_string + '"\n'
                        F.write(out_string)  # write in .csv format
                subject_results = []  # reset for the next subject
            previous_subject = subject  # update

            # Add trial info and transcription to results
            result = [subject, item, cond, transcription_text, str(speech_onset), filename_original]
            results.append(result)
            subject_results.append(result)

            # Print progress
            print(f"{blue_font}Processed file no. {i+1} / {total}  ---  {file}  ---  {transcription_text}{reset_color}")

        else:
            print(f"{red_font}Skipping file {i+1} {file}{reset_color}")

        # Write file for the the final subject
        if i+1 == total:
            print(f"\n{green_font}Writing file for subject {previous_subject} (final subject).{reset_color}\n")
            outfilename = f"{path_out}/annotations_{previous_subject}.csv"
            with open(outfilename, 'w', encoding="utf8") as F:
                F.write('\"UniqueID\",\"ItemNum\",\"Condition\",\"WhisperAnnotation\",\"SpeechOnset\",\"FilenameRecording\"\n')
                for res in subject_results:
                    out_string = '","'.join(res)
                    out_string = '"' + out_string + '"\n'
                    F.write(out_string)  # write in .csv format

    else:
        print(f"{red_font}No .{file_format} files found in {path}.{reset_color}")
        sys.exit(1)

print('Done.\n')
