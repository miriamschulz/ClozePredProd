# About

This folder contains the items for the Cloze Prediction & Production experiment.

# Item preprocessing pipeline

The pipeline to transform the items&fillers as downloaded from Google docs to PC Ibex usable stimuli tables is as follows:

- Download the current versions of `stim_exp.csv` and `fillers.csv` from the Google Docs folder.
- Check the fillers and items for noun overlap using `check_stimuli.Rmd`.
- Combine the items + fillers and format everything to PCIbex readable .csv files using `format_for_pcibex.Rmd`.
- Generate several pseudorandom trial orders in these files using the python script `pseudorandomize_many_orders.py` (usage: `python pseudorandomize_many_orders.py <folder containing preformatted csv pcibex lists> <n_randomizations>`; different orders will have a different Group for PCIbex Latin square group distribution).
- Check the resulting pseudorandomized files manually using the `check_pseudorandomization.Rmd`.

If everything worked, the pseudorandomized files can be uploaded to chunk_includes on the PC Ibex experiment.
