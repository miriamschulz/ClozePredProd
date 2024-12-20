# About

This folder contains the items for the Cloze Prediction & Production experiment.

# Item processing pipeline

The pipeline to transform the items&fillers as downloaded from Google docs to PC Ibex usable stimuli tables is as follows:

- Download the current versions of `stim_exp.csv` and `fillers.csv` from the Google Docs folder.
- Check the fillers and items for noun overlap using `check_stimuli.Rmd`.
- Combine the items + fillers and format everything to PCIbex readable .csv files using `format_for_pcibex.Rmd`.
- Pseudorandomize the order of the trials in these files using the python script `pseudorandomize.py` (usage: `python pseudorandomize.py comprehension_l1.csv comprehension_l2.csv <etc>`)
- Check the resulting pseudorandomized files manually using the `check_pseudorandomization.Rmd`.

If everything worked, the pseudorandomized files `comprehension_l1_pseudorandomized.csv` etc. can be uploaded to chunk_includes on the PC Ibex experiment.
