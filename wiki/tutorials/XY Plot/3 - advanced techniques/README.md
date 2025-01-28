# Tutorials / XY Plot: 3 - advanced techniques

Welcome to this third (and last) tutorial of the XY Plot series!

Here we are going to see a few advanced techniques you may find useful.\
Of course, I cannot anticipate all the use cases, but by following this tutorial, I hope you will see the versatility of the ComfyLab XY Plot nodes, and understand how to adapt for your scenario.\
Here, no frills, we'll go straight to the point, to focus of the functionalities rather than fancy grid customization.

> [!IMPORTANT]
> If you haven't yet, it is recommended to follow (at least read) the first 2 tutorials ([1](../1%20-%20the%20basics/) & [2](../2%20-%20pimp%20my%20grid/)), and read the [XY Plot core concepts](../../../node%20reference/xy%20plot/0%20-%20core%20concepts.md).\
> You will probably need them in this advanced tutorial.

Tutorial sections:

- [Part 1 - Various checkpoints (or LoRAs, ...)](#part-1---various-checkpoints-or-loras-)
- [Part 2 - Various resolutions and aspect ratios](#part-2---various-resolutions-and-aspect-ratios)
- [Part 3 - Using the Output Config node](#part-3---using-the-output-config-node)
- [TL;DR / Conclusion](#tldr--conclusion)

> [!TIP]
> As for all nodes in this extension, you can get useful contextual information, by just **moving the mouse pointer over a node or its inputs / widgets / outputs**. This should help you understand some details, without reading the more detailed wiki pages (yet).

And as always, if you do not want to follow all the steps, you can jump directly to [the conclusion](#tldr--conclusion).

---

## Part 1 - Various checkpoints (or LoRAs, ...)

**Load either `workflow - part 1.json` or `workflow - part 1.png` into ComfyUI.**\
**Important:**

- in the first input list, adjust to checkpoints that are available in your ComfyUI instance
- do no add the `.safetensors` extension, it will be added automatically

Execute the workflow.

![result - part 1](./details/result%20-%20part%201.jpg)

Here we build a grid with 2 different checkpoints, vs a list of predefined seeds.

What should be noticed:

- checkpoints:
  - we have chosen not to include the `.safetensors` extension in the input
    - it would have been displayed in the row headers, making them too long
  - instead, we have used a `Format: String` node, to append `.safetensors` to the `dim1 value` output of the `Queue` node
  - but by simply doing so, we cannot pipe the text output to the `Load Checkpoint` node, why?
    - the `chkpt_name` widget does not accept any string, but a string that exists in the list
  - so to bypass this limitation we simply convert the text output to Any, thanks to the `Convert to Any` node
    - ![Any output](./details/detail%20-%20part%201%20-%20any.jpg)
    - you can read more about the Any output in the [XY Plot core concepts](../../../node%20reference/xy%20plot/0%20-%20core%20concepts.md), and the [2nd tutorial of the `Output Config` node](../../Output%20Config/2%20-%20more%20options)
- seeds:
  - theoritically, we should have converted the list values to integers, thanks to the `convert` combo widget
    - but it also works (for seeds only AFAIK)

Lessons learned:

- combo widgets (as `chkpt_name` in `Load Checkpoint`) do not accept simple strings
  - a workaround is to use an output with type Any (`"*"`)
    - should we have included the `.safetensors` in the first input, we could have dropped the `Format: String` and `Convert to Any` node, because the type of `Queue` outputs is Any
      - but this wouldn't be great in terms of display in the grid
- the checkpoint list is connected to `dim1`, not `dim2`, for a performance reason
  - if you want: just switch dim1 / dim2 and check the processing time _(more in the core concepts page)_

> [!TIP]
> You can basically use this approach for any combo widget, in particular when loading models (LoRA, ...).\
> But be **very cautious** about the values you set in input: by using the Any type, we bypass the standard ComfyUI type checks, so the workflow may fail if the values are incorrect.

## Part 2 - Various resolutions and aspect ratios

**Load either `workflow - part 2.json` or `workflow - part 2.png` into ComfyUI.**\
Adjust the checkpoint to one available in your ComfyUI instance.\
Execute the workflow.

![result - part 2](./details/result%20-%20part%202.jpg)

What we did:

- include the ComfyLab `Resolution to Dimensions` node, to split the first input (`1024 x 1024`, ...) into width and height, piped into `Empty Latent Image`
  - we could have done this differently, I chose this method as it is straightforward in this case
- we also used a 2nd input list to set rotations, piped into the `rotation` input of `Rotate Latent`
  - remember, we can do that because the `Queue` outputs are of type Any

While probably not the most useful as such, this example demonstrates **the ability of the ComfyLab XY Plot to handle various resolutions or aspect ratios within the same grid**.

## Part 3 - Using the Output Config node

Here the workflow is similar to [Part1](#part-1---various-checkpoints-or-loras-), except that we use the `Output Config` node, to simplify and standardize our workflow.

**Load either `workflow - part 3.json` or `workflow - part 3.png` into ComfyUI.**\
**Copy one of the `output config - part 3.*` file, adjust the checkpoints to your env, and load it into the `Output Config` node.**

- you should get outputs like this (more than the 4 displayed here):
- ![outputs](./details/detail%20-%20part%203%20-%20output%20config.jpg)

Execute the workflow.

![result - part 3](./details/result%20-%20part%201.jpg)

As expected, we have strictly the same results as in [Part 1](#part-1---various-checkpoints-or-loras-).

What should be noticed:

- the output config file is available in 3 different formats: JSON, JSON5 and YAML
- we replaced the input lists by a single `Output Config` node
  - we also added more outputs to the config file: CFG, steps, sampler, ... quite a lot indeed
  - of course, we could have used 2 different `Output Config` nodes, one for the XY Plot itself, and another one for the other values: it's up to you to define how you want to standardize your configs
- note how the `Output Config` node auto-detects the type from output values:
  - for example, `cfg` is written without quotes, so it's detected as a string
  - but for more combo widgets (sampler, scheduler), we have to force type to be Any (`*`)

> [!NOTE]
> We won't go into details here about the configuration file itself, but you can find more information in the corresponding [node reference](../../../node%20reference/output%20config.md) and the [dedicated tutorials](../../../tutorials/Output%20Config/).

## TL;DR / Conclusion

In this tutorial, we have:

- seen how to handle various checkpoints (or virtually any sort of model)
  - and optimized the grid display at the same time
- demonstrated the ability of the XY Plot to include images or various dimensions / apect ratios within the same grid
- shown how we can use the `Output Config` node, to keep a collection of configs, while standardizing our workflow

This tutorial is still in construction, so I will certainly add most techniques in the future, be sure to check.

Also, you will find [various examples](../../../examples/) in the wiki (with less explanations).

In the meantime, if you have any suggestion, feel free to open [a discussion](https://github.com/bugltd/ComfyLab-Pack/discussions).

Thank you for reading, enjoy!
