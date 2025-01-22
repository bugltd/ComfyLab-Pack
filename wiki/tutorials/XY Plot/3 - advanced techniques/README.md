# Tutorials / XY Plot: 3 - advanced techniques

Welcome to this third (and last) tutorial of the XY Plot series!

Here we are going to see a few advanced techniques you may find useful.\
Of course, I cannot anticipate all the use cases, but by following this tutorial, I hope you will see the versatility of the ComfyLab XY Plot nodes, and understand how to adapt for your scenario.\
Here, no frills, we'll go straight to the point, to focus of the functionalities rather than fancy grid customization.

If you haven't yet, I highly recommend you follow (at least read) the first 2 tutorials ([1](../1%20-%20the%20basics/) & [2](../2%20-%20pimp%20my%20grid/)), and read the [XY Plot core concepts](../../../node%20reference/xy%20plot/0%20-%20core%20concepts.md).

Tutorial sections:

- [Part 1 - Various checkpoints (or LoRAs, ...)](#part-1---various-checkpoints-or-loras-)
- [Part 2 - Various resolutions and aspect ratios](#part-2---various-resolutions-and-aspect-ratios)
- [TL;DR / Conclusion](#tldr--conclusion)

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

What is to be noticed:

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

## TL;DR / Conclusion

In this tutorial, we have:

- seen how to handle various checkpoints (or virtually any sort of model)
  - and optimized the grid display at the same time
- demonstrated the ability of the XY Plot to include images or various dimensions / apect ratios within the same grid

This tutorial is still in construction, so I will certainly add most techniques in the future, be sure to check.

Also, you will find [various examples](../../../examples/) in the wiki (with less explanations).

In the meantime, if you have any suggestion, feel free to open [a discussion](https://github.com/bugltd/ComfyLab-Pack/discussions).

Thank you for reading, enjoy!
