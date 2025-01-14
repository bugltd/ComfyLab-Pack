# Tutorials / Output Config: 01 - simple (value & label)

In this first tutorial, we demonstrate the use of `Output Config: Load` with the good old KSampler workflow, and some basic output configuration.

## Let's play

### Init the workflow

- download and open file `wortkflow.json` or `workflow.png` (in current repo folder), in ComfyUI
- or start with the default KSampler workflow, and just add node `Output Config: Load`

### Create the outputs from config

- download any of the `config 01 - *` config files in your favorite format: json, json5, or YAML
  - json5 and yaml allow comments, standard json doesn't
- in `Output Config: Load`, click on `Load output config`, and load the config file

At this point, you should see something like (example with the `.json5` config file):

![result](./details/result.jpg)

> Note: the label for the 4th output has been customized according to our config

### Connect the dots and run

Connect each of the outputs:

- 'seed' to `KSampler` / seed
- 'cfg' to `KSampler` / cfg
- 'steps' to `KSampler` / steps
- 'a basic prompt but a custom label' to `CLIP: Text Encode` (the positive one obviously)

Run the prompt: click the main blue `Queue` buttom.
