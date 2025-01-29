# Tutorials / XY Plot

The `XY Plot` nodes allow you to create the grids you want, with virtually no limitation and many customization options:

- simple to use by default: only 2 nodes
  - optional configuration nodes to customize the grid, or the page header / footer
  - with possible pagination, row / column switch
- auto-queuing (with error / interruption detection)
- you can virtually make anything vary: CFG, seed, checkpoint / sampler / LoRA / ...
- not restricted to KSampler: can be adapted to any process generating images
- many configuration options:
  - font (type / size / color)
    - in row / column headers, and/or page header / footer
    - either one of the 4 fonts shipped with the extension, or any other TTF font on your disk
  - background color:
    - make your grid transparent (RGBA) to add a custom background image
  - padding, wrap, ...
- mix any image resolution / aspect ratio

> [!NOTE]
> If needed, you can also check the [node references](../../node%20reference/xy%20plot/) for the [core concepts](../../node%20reference/xy%20plot/0%20-%20core%20concepts.md) and detailed node information.

## Tutorial 1 - the basics

**[>> Go to the tutorial](./1%20-%20the%20basics/)**

Contents:

- our first grid: list input, queue processing, ...
- string templating
- rows / columns and pagination

## Tutorial 2 - pimp my grid

**[>> Go to the tutorial](./2%20-%20pimp%20my%20grid/)**

Contents:

- customize the grid: background color, font, gap, ...
- add a page header and/or footer, and configure them separately
- make the grid RGBA to add a custom background inage
- display 'page X / Y'

## Tutorial 3 - complex variations

**[>> Go to the tutorial](./3%20-%20complex%20variations/)**

Contents:

- various checkpoints (or virtually any model, LoRA, ...), following 3 methods using:
  - dedicated nodes to manually select a list of checkpoints / LoRAs / samplers / scheduler
  - a more versatile approach for vurtually anything (models, any combo value)
  - the `Output Config` node to keep the use case data separated from your workflow
