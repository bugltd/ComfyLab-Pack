# Tutorials / Output Config: 1 - simple (value & label)

In this first tutorial, we cover the core principles of `Output Config: Load` with the good old KSampler workflow, and some basic output configuration.

If you have no time yet to follow it, you can jump to [the conclusion](#tldr--conclusion).

## Part 1 - Let's play

### Init the workflow

- open [wortkflow.json](./wortkflow.json) or [workflow.png](./workflow.png) of current folder, in ComfyUI
- or start with the default KSampler workflow, and just add node `Output Config: Load`

### Create the outputs from config

- choose any of the `config 01 - *` config files in your favorite format: `json`, `json5`, or `yaml`
  - `json5` and `yaml` allow comments, standard `json` doesn't
    - I recommend `json5` or `yaml` for this reason, especially if you intend to share your configs with others
    - you will find some detailed explanations in the json5 / yaml example files provided here
- in `Output Config: Load`, click on `Load output config`, and select the config file

At this point, you should see something like this (example with the `.yaml` config file):

![node detail](./details/result%2001.jpg)

> Note: the label for the 4th output has been customized according to our config

### Connect the dots and run the workflow

Connect each of the outputs:

- `seed` to `KSampler` / seed
- `cfg` to `KSampler` / cfg
- `steps` to `KSampler` / steps
- `a basic prompt but a custom label` to `CLIP: Text Encode` (the positive one obviously)

> if you have difficulties doing it, right-click on destination node and `convert widgets to inputs`

Run the prompt: click the main blue `Queue` buttom.

### Adjust to your liking

Modify the config files, change the prompt, or any value as you wish. Enjoy, there is plenty to do at this stage already!

> You can use any text editor to modify the files. I personally use VSCode, with the `JSON5 KIT` extension (but it's probably overkill for many).

## Part 2 - understanding the config

### Preserving connections (and your expectations)

Now, load any of the `bad config 01 - *` files.

![node detail](./details/result%2002.jpg)

We can see that all connections except `seed` have been dropped. Why? There are 3 different reasons for that:

- `cfg` has been renamed to `cfg2`
- the value for `steps` has been changed from `40` to `"40"`
  - note the quotes: the value is now a string, not a number anymore
- the label for `prompt` has been changed

> This is intended, to restrict ambiguity when opening a new file. **There are 3 reasons for a connection to be dropped:**
>
> 1. the output name has changed -> drop
> 2. the value type has changed -> drop: if the destination node expects a number, we cannot send a string
> 3. the label has changed -> drop: if your labelled your output a certain way, it's probably for a reason

### Valid config but wrong value type

Now, reconnect the outputs to the `KSampler` node. **It will work for all but `steps`**. Why? \
The reason is simple: the `steps` input in `KSampler` is designed to accept numbers (integers, actually), which seems totally logical. \
By putting our value in quotes, we made it a string, which is not accepted by KSampler / steps.

> It's highly important to respect the type expected by the destination node inputs / widgets: a number is a number, a string is a string. \
> And there's no way the `Output Config: Load` can magically guess, because it cannot predict where the outputs will be connected.

## TL;DR / Conclusion

That's it for this first part!\
We have covered most of the core principles of the `Output Config: Load` node:

- config files can be either in `JSON`, `JSON5` or `YAML` format
  - `JSON5` and `YAML` are probably better if you intend to share your configs with others
    - it will allow you to document your config, link to your Civitai account, ...
- you can set virtually any number of outputs, you decide how to structure your use case, and how to connect your outputs to other nodes
- values can be expressed in 2 ways:
  - by a simple `<output> = <value>` entry
  - or inside a dictionary, with the mandatory `value` key
- labels can be customized, by adding the `label` key
- existing connections are dropped if any of the following is changed: name, type or label
- adjust the output type to the type expected by the destination input
  - by default, the output type is deducted from the value: it can be a string, a number (integer and/or float), a boolean, an array (list)... or anything else, you choose
    - types can be enforced though, we will cover that in the next tutorial

In the next tutorial, we will see other configuration options (to make your node look like a christmas garland if you wish), and how validation errors are handled.

To jump to it: **[follow the link](../2%20-%20more%20options/)**
