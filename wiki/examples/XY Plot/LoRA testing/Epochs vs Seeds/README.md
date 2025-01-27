# Examples / XY Plot / LoRA testing / Epochs vs Seeds

> As always, we use the following convention for node color:
>
> - Green: input node you surely want to customize
> - Blue: the specific nodes we use for processing / customization
>
> Of course, adjust to your env / needs: checkpoint, prompt, CFG, ...

These examples are intended for quick re-use, feel free to check [the tutorials](../../../../tutorials/) for more detailed explanations.

Sections:

- [Available examples](#available-examples)
  - [Epochs vs Fixed seeds](#epochs-vs-fixed-seeds)
- [Some explanations](#some-explanations)
  - [Building the LoRA file name](#building-the-lora-file-name)
  - [Seed list](#seed-list)

> Note: Here we do not customize the grid look, but it can easily be done by plugging the `OutputConfig: Grid` node to `XY Plot: Render`.

## Overview

The following examples demonstrates the ability to test multiple LoRA epochs vs seeds.\
This can be done in a "traditional" way, with separate input nodes for the LoRA prefix, epochs and seed list: see example [Epochs vs Fixed seeds](#epochs-vs-fixed-seeds).

## Available examples

### Epochs vs Fixed seeds

Load either `LoRA testing - epochs vs fixed seeds.json` or `LoRA testing - epochs vs fixed seeds.png` into ComfyUI.

## Some explanations

### Building the LoRA file name

First, we define the LoRA prefix, without the epoch: we build the filename later.\
![LoRA prefix](./images/details%20-%20lora%20prefix.jpg)

We also define the epochs we want to test, separated by commas.\
![epochs](./images/details%20-%20input%20epochs.jpg)

> Notes:
>
> - we can of course use a different separator, simply adjust the `separator` to your needs
> - no need to pad the epochs to 6 characters, we do that later
> - we could convert the epoch numbers to integers, this would just require a tiny adjustment to the template string

We build the LoRA model file name thanks to the `Format String` node. Here specifically, we prefix with the LoRA name, followed by the epoch (padded to 6 digits), then finally add the file extension.\
![format file name](./images/details%20-%20format%20lora%20name.jpg)

> Note: check the [node reference](../../../../node%20reference/format.md) for more details, and also visit [this guide](https://pyformat.info/) for different techniques applicable to Python string `format()` method

Finally, we pipe the resulting string to `Load LoRA`, after converting it to type Any (`*`). More explanations in the [XY Plot tutorial: 3 - advanced techniques](../../../../tutorials/XY%20Plot/3%20-%20advanced%20techniques/).

## Seed list

Some important details to notice about the seed list:\
![seed list](./images/details%20-%20seed%20list.jpg)

- we convert the values to integers, as it is the type expected by the `KSampler` `seed` widget. More explanations in the [XY Plot core concepts](../../../../node%20reference/xy%20plot/0%20-%20core%20concepts.md).
- we could also load the seed list for a simple text file. You can use the example `seed list.txt` file provided in current folder as an example.
