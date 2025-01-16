# Node reference / XY Plot: 00 - Core concepts

As a minimum, to use the `XY Plot`, you need to integrate 2 nodes, `XY Plot: Queue` and `XY Plot: Render`: the first one will organize the queue, the second one will render the grid(s).

![standard nodes](./images/nodes.jpg)

They must be connected by the specific `XY plot data` link

- that is the way the queue can inform the render node about the current processing state

## XY Plot: Queue

As you can see, there is no concept of row / column or X / Y here, as in many other plot / grid implementations:

- instead, we talk about `dim` and `dim2` (dimensions 1 & 2)
  - this is intended, to improve performance: but we'll talk about that later
  - just remember this rule: **for a given `dim1` value, we process all values of `dim2` before switching to the next `dim1`**
  - whether `dim1` and `dim2` are rows or columns is configured later, in the `Render` node
- `dim1` and `dim2` (optional) **take lists as inputs**
  - in ComfyUI, a LIST is a LIST, but we cannot know if it's a list of strings, numbers, images, ...
  - so another important rule: **what you send is what you get**
    - said differently: if you send a list of numbers, you will get number values in output
    - or one could say: sh\*t in, sh\*t out...
- for the reason above, the `Queue` node cannot determine what it will get in input, so the type of the outputs is set to `"*"` (Any)
  - this make the `dim1 value` and `dim2 value` outputs very flexible, as you can basically connect them anywhere
  - but it comes at a price: **you must ensure that the data in input correspond to the expected data in output**
    - for example: if you connect `dim1 value` to the `cfg` input of `KSampler`, you must ensure that the input list is a list of integers. If you send strings, you will obviously get an error when running the workflow
- one of the main features of the `Queue` node is **auto-queuing**
  - no need to reset a counter, or manually increase the batch size
  - **the `Queue` node will take care of that for you**
  - in fact, you should definitely **not set the batch size to anything else than `1`**

## XY Plot: Render

The `Render` node, in its default configuration is easier to understand:

- it takes an `image` as input, for example the result of the `KSampler` processing
- <ins>important</ins>: you are not limited to KSampler
  - in fact **you can do what you want between the `Queue` node and the `Render` one**
  - it could be loading the image from a folder, doing some image transformations... you decide
- it has 2 outputs:
  - `image` is the single image, as received in input
  - `grid` is the generated grid, when it has received enough images
    - obviously, you can generate multiple grids, but you configure pagination

As per the widgets:

- `dim1: header format` and `dim2: header format`
  - enter here a template string, following the syntax of Python string `format()` method
  - the `{dim1}` and `{dim2}` placeholders will be replaced by the current dim1 / dim2 value
  - very handy if you want to prefix the row / column headers, for example:
    - if you have CFG values in dim1, by default the headers will be `7.5`, `8`, ...
    - just change the dim1 header format to `CFG: {dim1}` and you will get: `CFG: 7.5`, `CFG: 8`, ...
  - there are plenty of advanced techniques, but you will probably not use them here
    - however if you want to learn more, you can check the [`Format` node reference](../format.md)
- `direction`: whether dim1 values are displayed as rows, or columns
