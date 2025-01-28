# Tutorials / XY Plot: 3 - Complex variations

Welcome to this third tutorial of the XY Plot series!

Here we are going to see a few advanced techniques, to make virtually anything vary, for example models or any value in a combo widget.\
To achieve that, we will use 3 different methods:

- simple: with dedicated nodes, for checkpoints / LoRAs / samplers / schedulers
- versatile: adaptable to any kind of model (or combo widget)
- with the [`Output Config`](../../Output%20Config/) node: to standardize your workflow, and keep parameters separated

Each of these approaches will generate the same results: depending on your specifity, pick the one that matches your specific needs.

> [!TIP]
> In the following, we vary checkpoints vs a fixed list of seeds.
> If you prefer to have a new set of **random seeds** each time you generate the grid, just replace the corresponding `List: ftom Multiline` node with `List: Random Seeds`.

Tutorial sections:

- [Expected results](#expected-results)
- [Part 1 - Simple: with a dedicated node (for checkpoints, LoRAs, samplers, schedulers)](#part-1---simple-with-a-dedicated-node-for-checkpoints-loras-samplers-schedulers)
- [Part 2 - Versatile: any model (or combo widget)](#part-2---versatile-any-model-or-combo-widget)
- [Part 3 - With the `Output Config` node](#part-3---with-the-output-config-node)
- [TL;DR / Conclusion](#tldr--conclusion)

And as always, if you do not want to follow all the steps, you can jump directly to [the conclusion](#tldr--conclusion).

---

## Expected results

If you use the exact same parameters:

- checkpoints: `sd_xl_base_1.0`, `Juggernaut-XI-byRunDiffusion`
- seeds: `156680208700286`, `715168739510668`, `568208062071311`

You should get the same result:\
![result grid](./details/result%20.jpg)

## Part 1 - Simple: with a dedicated node (for checkpoints, LoRAs, samplers, schedulers)

> [!TIP]
> Here we use the `List: Checkpoints` node, that allows to select any number of checkpoints (from your ComfyUI `models/checkpoints` folder), and get a list of file names.\
> Similar nodes exist for: LoRAs, samplers, schedulers.

**Load either `workflow - part 1.json` or `workflow - part 1.png` into ComfyUI.**\
**Important:**

- in the `List: Checkpoints` node, select a few checkpoints from your env
  - in the example, I use SDXL 1.0 and Juggernaut XL v11
- ensure the widget `with file extension?` is unchecked, as we will add the extension later

Execute the workflow.

### What should be noticed

> [!NOTE]
> we have chosen to not include the `.safetensors` extension in the input: it would have been displayed in the row headers, making them too long.\
> Of course, you can keep it, and skip the following.

To append the `.safetensors` extension:

- we use a `Format: String` node, to add the extension to the `dim1 value` output of the `Queue` node
- but by simply doing so, we cannot pipe the text output to the `Load Checkpoint` node, why?
  - the `chkpt_name` widget does not accept any string, but a string that exists in the list
- so to bypass this limitation we simply convert the text output to Any, thanks to the `Convert to Any` node
  - ![Any output](./details/detail%20-%20part%202-%20any.jpg)

> [!NOTE]
> You can read more about the Any output in the [XY Plot core concepts](../../../node%20reference/xy%20plot/0%20-%20core%20concepts.md), and the [2nd tutorial of the `Output Config` node](../../Output%20Config/2%20-%20more%20options/)

### Lessons learned

- combo widgets (as `chkpt_name` in `Load Checkpoint`) do not accept simple strings
  - a workaround is to use an output with type Any (`"*"`)
    - should we have included the `.safetensors` in the first input, we could have dropped the `Format: String` and `Convert to Any` nodes, because the `XY Plot: Queue` outputs are themselves of type Any
    - but this wouldn't be great in terms of display in the grid
- the checkpoint list is connected to `dim1`, not `dim2`, for a performance reason
  - for the test: just switch dim1 / dim2 and check the processing time _(more in the [core concepts page](../../../node%20reference/xy%20plot/0%20-%20core%20concepts.md))_

## Part 2 - Versatile: any model (or combo widget)

While it is usually simpler to use the `List` nodes dedicated to checkpoints / LoRAs / samplers / schedulers, there are some cases where we need to use a more versatile approach:

- we want to vary another type of model / value from a combo widget
- we have stored the list as a separate text file (e.g. test case), and prefer to re-use it, rather than manually selecting the values

This short part will cover exactly that, to show how you can adapt the XY Plot to many specific cases.

**Load either `workflow - part 2.json` or `workflow - part 2.png` into ComfyUI.**\
**Important:**

- in the first input list, adjust to checkpoints that are available in your ComfyUI instance
- do no add the `.safetensors` extension, it will be added automatically

Execute the workflow.

### Lessons learned

You can basically use this approach for any combo widget, in particular when loading models, or any value in a combo widget.

> [!IMPORTANT]
> Be **very cautious** about the values you set in input: by using the Any type, we bypass the standard ComfyUI type checks, so the workflow may fail if the values are incorrect.

## Part 3 - With the `Output Config` node

Here the workflow is similar to [Part1](#part-1---simple-with-a-dedicated-node-for-checkpoints-loras-samplers-schedulers) and [Part 2](#part-2---versatile-any-model-or-combo-widget), except that we use the ComfyLab [`Output Config`](../../../node%20reference/output%20config.md) node, to keep our workflow and values separated.

**Load either `workflow - part 3.json` or `workflow - part 3.png` into ComfyUI.**\
**Copy one of the `output config - part 3.*` files, adjust the checkpoints to your env, and load it into the `Output Config` node.**

- you should get outputs like this (more than the 4 displayed here):
- ![outputs](./details/detail%20-%20part%204%20-%20output%20config.jpg)

Execute the workflow.

As expected, we have strictly the same results as in [Part1](#part-1---various-checkpoints-or-loras-samplers-schedulers) and [Part 2](#part-2---vary-any-model-or-combo-widget).

### What should be noticed

- the output config file is available in 3 different formats: JSON, JSON5 and YAML
- we have replaced the input lists by a single `Output Config` node
  - we've also added more outputs to the config file: CFG, steps, sampler, ... quite a lot indeed
  - of course, we could have used 2 different `Output Config` nodes, one for the XY Plot itself, and another one for the other values: it's up to you to define how you want to standardize your configs
- note how the `Output Config` node auto-detects the type from output values:
  - for example, `cfg` is written without quotes, so it's detected as a float
  - but for combo widgets (sampler, scheduler), we have to force type to be Any (`*`)

> [!TIP]
> We won't go into details here about the configuration file itself, but you can find more information in the corresponding [node reference](../../../node%20reference/output%20config.md) and the [dedicated tutorials](../../../tutorials/Output%20Config/).

## TL;DR / Conclusion

In this tutorial, we have covered 3 different methods to make checkpoints (or many other things) vary:

- simple one, using a dedicated node: applicable to checkpoints, LoRAs, samplers, schedulers
- a more versatile one, that should adapt to many of your use cases
- one using the `Output Config` node, to standardize your workflow and keep the values separated

> [!TIP]
> You can find [more examples](../../../examples/) in the wiki.

If you have any suggestion on how to improve this wiki, feel free to open [a discussion](https://github.com/bugltd/ComfyLab-Pack/discussions).

Thank you for reading, enjoy!
