# Tutorials / XY Plot: 01 - the basics

In this first tutorial, we are going to generate our first grids, using the 2 standard XY Plot nodes.
We will also focus a bit on some useful utility nodes, and play with string templating, pagination, and switch rows / headers as we wish.

Tutorial sections:

- [Part 1 - Our first grid (and some useful explanations)](#part-1---our-first-grid-and-some-useful-explanations)
- [Part 2 - String templating](#part-2---string-templating)
- [Part 3 - rows / columns and pagination](#part-3---rows--columns-and-pagination)

To keep it simple, we will not detail the core concepts here. But if you are interested, now or later, you can check the [dedicated page](../../../node%20reference/xy%20plot/00%20-%20core%20concepts.md).

> As for all nodes in this extension, you can get useful contextual information, by just **putting the mouse pointer over a node or its inputs / widgets / outputs**. This should help you understand some details, without reading the more detailed wiki pages (yet).

And as always, if you do not want to follow all the steps, you can jump directly to [the conclusion](#tldr--conclusion).

---

## Part 1 - Our first grid (and some useful explanations)

**Load either `workflow - part 1.json` or `workflow - part 1.png` into ComfyUI.**\
**Ensure that the batch size is set to 1 (default)**.\
Adjust the checkpoint to one available in your ComfyUI instance.
Execute the workflow.

You should get something like this (obviously not exactly the same images):
![result - part 1](./details/result%20-%20part%201.jpg)

What do we see?

- the `image` output of the `Render` node is updated at each KSampler processing
- the `grid` output, however, is only rendered when the whole queue has been processed

### Understanding the config and processing

#### The inputs

The `Queue` node takes lists as inputs. For this we use the nodes `Format: from Multiline` and `Format: from String`, available in the ComfyLab extension.\
Of course, you can choose nodes from other extensions, as long as they provide lists.

> There are other list-related nodes in the ComfyLab collection if you need

Let's focus a bit:

##### prompt input (multiline)

If you look at the first one, you'll see that we haven't generated images of an astronaut. That's because the line starts with a `#`, and the node is set to strip comments.\
![strip comments](./details/detail%20-%20part%201%20-%20comments.jpg)\
Just remove the `#` and you will get an astronaut!

##### CFG input (string with seperator)

![float conversion](./details/detail%20-%20part%201%20-%20float.jpg)\

- we have set the values in a string, separated by `, `: `5.5, 7, 10.5`
  - the separator is configured accordingly, you can use any character you want: `/`, `|`, `&`, ...
- and we have configured the conversion: `convert: float`
  - that is a very important [core concept](../../../node%20reference/xy%20plot/00%20-%20core%20concepts.md):
    - the `Queue` node cannot determine to which input you will connect the dim values
    - that is why the output type is `*` (Any): you can connect them anywhere, but **you must ensure the type of input values corresponds to where you will use them**

For the test, just set the `convert` widget to `disabled`. You will get an error on execution: CFG expects a float, and we sent strings.\
![conversion error](./details/detail%20-%20part%201%20-%20convert%20error.jpg)

#### processing / auto-queuing

The `Queue` and `Render` nodes are connected by the specific `XY plot data` link: that is the way the queue updates the render node with the current processing state.

During processing, the `Queue` node informs you about the current state: `Processing: 2 / 9` for example

- you can re-run, you will see that the queue is reinitialized automatically:
  - the `Queue` node is designed for **auto-queuing**: you don't have to reset a counter or adjust the batch size, **it takes care of everything for you**

## Part 2 - String templating

Let's do our first customizations, that will be short:

- in the dim1 multiline input, you can see that all lines start with `a photograpgy of`
  - that's redundant, and make row headers too long: let's optimize this
- in the grid, the columns just display the CFG values. Let's add a prefix `CFG: `

**Load either `workflow - part 2.json` or `workflow - part 2.png` into ComfyUI**.\
Execute the workflow.

![result - part 2](./details/result%20-%20part%202.jpg)\
Better, isn't it?

### string format to the rescue

What did we change?

First, we have inserted the [`Format: String` node](../../../node%20reference/format.md), between the dim1 output of the queue, and the CLIP Text Encode node.\
![format node](./details/detail%20-%20part%202%20-%20prompt.jpg)\
It is as simple as it is powerful:

- it takes advantage of Python string `format()` method, to allow string replacement, and many other things, by using placeholders: here `{arg0}`, as the name of the input
- this node also takes any number of inputs, even though we have just used one here
  - all credits to [@melMass](https://github.com/melMass) and his [comfy_mtb](https://github.com/melMass/comfy_mtb) extension for the dynamic input trick!
- here we just added a prefix and made a simple replacement: `photography of {arg0}`
- for more details about the `Format` nodes, we can read the [node reference](../../../node%20reference/format.md)

We did a very similar thing, this time in the `XY Plot: Render` node:\
![dim2 header](./details/detail%20-%20part%202%20-%20header.jpg)\

- we have set the `dim2: header format` string to `CFG: {dim2}`
- the only difference is the placeholder name, `{dim2}` here

## Part 3 - rows / columns and pagination

**Load either `workflow - part 3.json` or `workflow - part 3.png` into ComfyUI**.\
Execute the workflow.

What we have changed:

- the astronaut is back into business (we have removed the `#`, see Part 1)
- in the `XY Plot: Queue` node, we have set `dim1: max per page` to 2
  - this where we set the pagination (0 to disable it)
- in the `XT Plot: Render` node, the `direction` was changed to `dim1 as cols`

And if you observe the `grid` output of the Render node, we can indeed see that:

- it has generated 2 grids / pages (be quick to see both)
- prompt is now in columns, and CFG in rows

![page 1](./details/result%20-%20part%203%20-%20page%201.jpg)
![page 2](./details/result%20-%20part%203%20-%20page%202.jpg)

## TL;DR / Conclusion

We have covered many important things in this first tutorial:

- we only need 2 nodes to make grids: `Queue` and `Render`
  - there are linked with the specific `XY plot data` output / input
- the `Queue` node takes lists as inputs
  - although you can connect the outputs anywhere, you must ensure the type of the list values corresponds to the one expected by the input you connect it to
    - for example: float for CFG, integer for steps, ...
- you can use string templating (fornat) to customize the row / column headers, or to automatize prefixing
- you can easily activate pagination, and switch rows / columns, in the `Queue` and `Render` nodes respectively

Okay, that's nice, we have created grids, but TBH they have nothing special for the moment...\
**Where ComfyLab's XY Plot really shines is its configurability**, to help you design the grids you want, like you want:\
That's exactly what we are going to see in the **next tutoral: [02 - pimp my grid](../02%20-%20pimp%20my%20grid/)**
