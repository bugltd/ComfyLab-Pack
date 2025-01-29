# Examples / XY Plot / LoRA testing / Epochs vs Seeds

> [!NOTE]
> These examples are intended for quick re-use, feel free to check [the tutorials](../../../../tutorials/) for more detailed explanations.

Sections:

- [Overview](#overview)
- [Epochs vs Fixed seeds](#epochs-vs-fixed-seeds)
- [Epochs vs Fixed seeds (with Output Config)](#epochs-vs-fixed-seeds-with-output-config)
- [Epochs vs Random seeds](#epochs-vs-random-seeds)

> [!TIP]  
> Here we do not customize the grid look, but it can be done easily by plugging the `Plot Config: Grid` node to `XY Plot: Render`.

## Overview

The following examples demonstrate the ability to test multiple LoRA epochs vs seeds.

This can be done in a "traditional" way, with separate input nodes for the LoRA prefix, epochs and seed list: see example [Epochs vs Fixed seeds](#epochs-vs-fixed-seeds).\
Or we can simplify the inputs (and more), by using the ComfyLab `Output Config` node: [Epochs vs Fixed seeds (with Output Config)](#epochs-vs-fixed-seeds-with-output-config)

## Epochs vs Fixed seeds

Load either `LoRA testing - epochs vs fixed seeds.json` or `LoRA testing - epochs vs fixed seeds.png` into ComfyUI.

### Understanding the workflow

#### Building the LoRA file name

First, we define the LoRA prefix, without the epoch: we build the filename later.\
![LoRA prefix](./images/details%20-%20lora%20prefix.jpg)

We also define the epochs we want to test, separated by commas.\
![epochs](./images/details%20-%20input%20epochs.jpg)

> [!NOTE]
> We can of course use a different separator, simply adjust the `separator` to your needs.\
> No need to pad the epochs to 6 characters, we'll do that later.

We build the LoRA model file name thanks to the `Format String` node. Here specifically, we prefix with the LoRA name, followed by the epoch (padded to 6 digits), then finally add the file extension.\
![format file name](./images/details%20-%20format%20lora%20name.jpg)

> [!NOTE]
> More details in the [node reference](../../../../node%20reference/format.md), you can also visit [this guide](https://pyformat.info/) for different techniques applicable to Python string `format()` method

Finally, we pipe the resulting string to `Load LoRA`, after converting it to type Any (`*`). More explanations in the [XY Plot tutorial: 3 - complex variations](../../../../tutorials/XY%20Plot/3%20-%20complex%20variations/).

#### Seed list

Some important details to notice about the seed list:\
![seed list](./images/details%20-%20seed%20list.jpg)

- we convert the values to integers, as it is the type expected by the `KSampler` `seed` widget. More explanations in the [XY Plot core concepts](../../../../node%20reference/xy%20plot/0%20-%20core%20concepts.md).
- we could also load the seed list for a simple text file. You can use the example `seed list.txt` file provided in current folder as an example.

## Epochs vs Fixed seeds (with Output Config)

Load either `LoRA testing - epochs vs fixed seeds (with Output Config).json` or `LoRA testing - epochs vs fixed seeds (with Output Config).png` into ComfyUI.

Here we have replaced the 3 input nodes by a single `Output Config` node, and loaded the file `output config.yaml` provided in this folder.

### Understanding the workflow

- the config file is in YAML format, but we could have used a JSON or JSON5 file the same way
  - YAML and JSON5 allow comments, which is pretty convenient
- note how we have defined both dim1 / dim2 input lists, but in 2 different ways
- no need to convert the seed values to integers: that is automatically deducted, as the values are not quoted, so the `Output Config` node understands they are integers
- we also added the prompt, we could have defined the CFG, steps, sampler, ... the same way

> [!TIP]
> More details about the `Output Config` node in the [node reference](../../../../node%20reference/output%20config.md) and [tutorials](../../../../tutorials/Output%20Config/).

Feel free to adjust the values, create a different file, ...

## Epochs vs Random seeds

Load either `LoRA testing - epochs vs random seeds.json` or `LoRA testing - epochs vs random seeds.png` into ComfyUI.

This example is similar to first one, except that we replace the `List: from Multiline` node with `List: Random Seeds`.

Thanks to it, we generate a new list of random seeds each time we want: either by refreshing the page, or by clicking the `Reset` button.
