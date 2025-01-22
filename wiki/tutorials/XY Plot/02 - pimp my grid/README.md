# Tutorials / XY Plot: 02 - pimp my grid

In this second tutorial, we are going to discover the true power of ComfyLab's XY Plot: its configurability.\
First by tweaking the grid itself, then by adding header and footer to the page.\
And finally, by setting a custom background image.

Tutorial sections:

- [Part 1 - Customize the grid](#part-1---customize-the-grid)
- [Part 2 - Add page header / footer](#part-2---add-page-header--footer)
- [Part 3 - Add a background image (RGBA mode)](#part-3---add-a-background-image-rgba-mode)
- [Part 4 - Display 'page X / Y`](#part-4---display-page-x--y)
- [TL;DR / Conclusion](#tldr--conclusion)
- [Going further (advanced)](#going-further-advanced)

> As for all nodes in this extension, you can get useful contextual information, by just **moving the mouse pointer over a node or its inputs / widgets / outputs**. This should help you understand some details, without reading the more detailed wiki pages (yet).

And as always, if you do not want to follow all the steps, you can jump directly to [the conclusion](#tldr--conclusion).

---

## Part 1 - Customize the grid

**Load either `workflow - part 1.json` or `workflow - part 1.png` into ComfyUI.**\
Adjust the checkpoint to one available in your ComfyUI instance.\
Execute the workflow.

![result - part 1](./details/result%20-%20part%201.jpg)

Very different, isn't it?\
We have just added the optional `Plot Config: Grid` node, and adjusted some configuration values:
![grid config](./details/detail%20-%20part%201%20-%20grid.jpg)

In details:

- increased `gap`
- set `background color` and `font color`
- changed the `font` and `font size`. Font can be:
  - either one of the fonts shipped in the extension: _Roboto-Regular.ttf_ / _Roboto-Bold.ttf_ / _Roboto-Italic.ttf_ / _Roboto-BoldItalic.ttf_,
  - or the full path to a locally-installed TTF font
  - this way you can make your grid really different
- `padding`: adjust the space surrounding the row / col headers
- `wrap`: wrap the row / col headers to a given number of characters, if they are too long

With just this simple optional node, we have already completely changed the look of our grid.\
But we can do more: let's add some page header / footer, shall we?

## Part 2 - Add page header / footer

**Load either `workflow - part 2.json` or `workflow - part 2.png` into ComfyUI.**\
Adjust the checkpoint to one available in your ComfyUI instance.\
Execute the workflow.

![result - part 2](./details/result%20-%20part%202.jpg)

Not the most aesthetic I admit... but that's just for the demonstration.\
We have added the `Plot Config: Header/Footer` node twice, one for the header and one for the footer.\
This way **you can configure them separately, or just add a footer for example**.\
![header](./details/detail%20-%20part%202%20-%20header.jpg)
![footer](./details/detail%20-%20part%202%20-%20footer.jpg)

Some of the configuration options are similar to the `Plot Config: Grid` (font, ...), and some are new:

- `text`: add some text, either at left / center / right
  - of course you can add multiple texts, as we have done in the footer
- `background color`: set a color (as in header), or use the special value `transparent` (as in footer) to keep the grid bg color
- `padding`: add vertical space above and below the header / footer text

> a note about colors (either font or background, in all the `Plot Config` nodes):\
> as you can see in the footer, you can specify them by name (eg `white`), instead of the traditional RGB hex notation

With just these 3 `Plot Config` nodes, we now have access to a bunch of configuration options.\
But there's maybe something more we can do: what about adding a custom background image?

## Part 3 - Add a background image (RGBA mode)

**Load either `workflow - part 3.json` or `workflow - part 3.png` into ComfyUI.**\
Adjust the checkpoint to one available in your ComfyUI instance.\
Upload a background image into the `Load Image` node. You can find 2 samples in the `backgrounds` subfolder, feel free to use your own.\
Execute the workflow.

![result - part 3](./details/result%20-%20part%203.jpg)

What did we do?

First, in the `Plot Config: Grid` node, we set the `background color` to the special value `transparent`, it will make the image RGBA:\
![transparent background](./details/detail%20-%20part%203%20-%20background.jpg)

Then, we pipe the `grid` output from `XY Plot: Render` to the standard node `Split Image with Alpha`, then IMAGE and MASK to `ImageCompositeMasked`:
![RGBA pipe](./details/detail%20-%20part%203%20-%20rgba.jpg)

Finally, we add a `Load Image` node to load the background, and connect it to `source` in `ImageCompositeMasked`.

All that with ComfyLab and a few Comfy Core nodes. That wasn't too difficult, don't you think?

## Part 4 - Display 'page X / Y'

**Load either `workflow - part 4.json` or `workflow - part 4.png` into ComfyUI.**\
Adjust the checkpoint to one available in your ComfyUI instance.\
Upload a background image into the `Load Image` node. You can find 2 samples in the `backgrounds` subfolder, feel free to use your own.\
Execute the workflow.

![result - part 4 page 1](./details/result%20-%20part%204%20-%20page%201.jpg)
![result - part 4 page 2](./details/result%20-%20part%204%20-%20page%202.jpg)

What did we do?\
![nodes](./details/detail%20-%20part%204%20-%20nodes.jpg)

We have simply added the `XY Plot: Split Data` node, then used a `Format: String` to build the text from `current page` and `total pages`, then finally pipe the formatted string into `text (right)` of the `Render` node:

> We have used `XY Plot: Split Data` to adjust the display, but of course it can be useful for other purposes, like naming the grid image file when saving it.

## TL;DR / Conclusion

In just 4 steps and 3 optional nodes, we have totally changed the look of our grid.

What we have covered:

- use the `Plot Config: Grid` to customize the grid:
  - cell gap, background / font color, font size, col / row padding, col / row wrap
  - you can use either one the fonts shipped with this extension, or use your own TTF one
- add page header / footer with the `Plot Config: Header/Footer` node
  - you can configure them separately, or just add a footer if you want
  - with custom text, either at left / center / right (or all of them)
  - set a custom background color, or use the grid one
  - custom font and padding
- make the grid RGBA, to add a background image thanks to a few standard nodes
- use `XY Plot: Split Data` to display 'page X / Y' in the footer

With these 2 tutorials, **we have seen how to create grids, and make them unique**.\
It's now your turn to use your creativity and aesthetic talent (surely better than mine), to make them as beautiful as you wish!

That being said, I hope you have found these tutorials interesting and easy to follow.\
If you have any suggestion to improve them (content, features, better English, shorter sentences, ...), feel free to open [an issue](https://github.com/bugltd/ComfyLab-Pack/issues), [a discussion](https://github.com/bugltd/ComfyLab-Pack/discussions), or even a Pull Request if you can.

Thank you for reading, and enjoy your beautiful grids my friends!

## Going further (advanced)

These 2 tutorials are intended for a large audience, and to cover the most standard use cases.\
But please note there are **many advanced techniques you can apply with ComfyLab XY Plot nodes**, for example:

- vary checkpoints, LoRA (any model in fact), ... virtually anything
  - automatize LoRA testing: different epochs, weight, ...
- use a totally different process: load images from multiple folders, apply transformations... it's totally flexible
- use various image resolutions / aspect ratios
- use a JSON / JSON5 / YAML config file, to standardize your workflow, and use a collection of test cases
  - with the [ComfyLab `Output Config` node](../../Output%20Config/)
- ...

If you want to dive deeper, I propose we move to the **next (and last) tutorial of the XY Plot series: 03 - advanced techniques**.\
But before doing that, please note:

- it addresses some edge cases that may not be needed for most
- it is not as detailed as those 2 first tutorials, we'll go faster
- if you haven't done it yet, I strongly advise you read the [XY Plot core concepts](../../../node%20reference/xy%20plot/00%20-%20core%20concepts.md): it's not long, and you may learn some important design choices there.

Interested? Let's go to the next tutorial: **[03 - advanced techniques](../03%20-%20advanced%20techniques/)**
