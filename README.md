<p align="center">
    <img src="static/repo_banner.png" title="welcome to ComfyLab Pack!">
    <br/>
    <span>A collection of carefully experimented nodes, to improve your Comfy UX.</span>
</p>

<h2 align="center"><a href="#️news">News</a> &nbsp; | &nbsp; <a href="#️node-overview">Node overview</a> &nbsp; | &nbsp; <a href="#documentation">Documentation</a> | &nbsp; <a href="#installation">Installation</a></h2>

# News

- 2025-01-28 - v0.0.5:
  - new List utility nodes: Random Seeds / Checkpoints / LoRAs / Samplers/ Schedulers
  - reorganize / improve wiki

# Node overview

**The complete list of nodes can be found in the [wiki / node list](./wiki/node_list.md)**

## XY Plot - _build beautiful and unique grids_

**Auto-queue**, make virtually **anything vary** (checkpoints, LoRAs, ...), **not restricted to KSampler**, ...\
**Many configuration options**: pagination, page header / footer, custom fonts (even your own), background,...\
**Make it RGBA** and add a custom background image for a very unique look.

<details>
<summary><strong>Detailed features</strong> <i>(click to show)</i></summary>

- simple to use by default: **only 2 nodes**
  - **optional configuration nodes** to customize the grid, or the **page header / footer**
  - with possible **pagination, row / column switch**
- **auto-queuing** (very simple to use, automatic error / interruption detection)
- you can virtually **make anything vary**: CFG, seed, checkpoint / sampler / LoRA / ...
- **not restricted to KSampler**: can be adapted to any process generating images
- **many configuration options**:
  - custom row/col headers, with string templating
  - font (type / size / color)
    - in row / column headers, and/or page header / footer (each configurable differently)
    - either one of the 4 fonts shipped with the extension, or any other TTF font on your disk
  - background color:
    - make **your grid transparent (RGBA)** to add a custom background image
  - padding, wrap, ...
- mix any image resolution / aspect ratio
- ...
</details>

> [!NOTE]
> For a quick start, it is advised to read the [core concepts](./wiki/node%20reference/xy%20plot/00%20-%20core%20concepts.md).\
> More information in the [XY Plot node reference](./wiki/node%20reference/xy%20plot/) and the [dedicated tutorials](./wiki/tutorials/XY%20Plot/), from simple to advanced.\
> You can also check the [examples](./wiki/examples/), they will be frequently extended.

## Output Config - _dynamic outputs from a config file_

Use the `Output Config` nodes to load custom config files, and **dynamically create any number of custom outputs**, that you can later connect to other nodes before executing the workflow.\
Very **useful to standardize your workflows**, and keep a collection of configurations / test cases separately, share them with others... and many other applications.

<details>
<summary><strong>Detailed features</strong> <i>(click to show)</i></summary>

- **any number of outputs**, you decide what you need for your speific cases
- **very simple** config file, by default, only `output: value` is needed
- optionally configure the **shape, color, and even the type** of each output
- available in **JSON / JSON5 / YAML** (with comments if you wish)
- strictly validated with a **JSON Schema**, with **detailed visual report** in case of errors
</details>

> [!NOTE]
> More information in the [Output Config node reference](./wiki/node%20reference/output%20config.md) and the [dedicated tutorials](./wiki/tutorials/Output%20Config/).\
> You can also check the [examples](./wiki/examples/), they will be frequently extended.

## Format String - _one node to rule them all_

Take advantage of the powerful **Python string `format()`** method, to build strings using placeholders.\
Very useful for many operations: **insert / prefix / append, concatenate, pad, truncate**, ...\
**Any number of inputs** _(credits to [@melMass](https://github.com/melMass) and his [comfy_mtb](https://github.com/melMass/comfy_mtb) extension for the trick!)_.\
Compatible with **integers, floats, booleans.**\
Exist in 2 flavors: **simple string and multiline**.

> [!NOTE]
> More information in the [Format String node reference](./wiki/node%20reference/format.md) and the [dedicated tutorials](./wiki/tutorials/Format/).\
> You can also check the [examples](./wiki/examples/), they will be frequently extended.

## Queue - _efficient and simple to use_

Exist in 3 flavors: **Generic**, **File**, **Image**.\
Very simple to use: **auto-queuing** (with error / interruption detection), no counter to reset or queue size to set.

## List utilities - _make lists as you want_

A set of nodes to **create lists** (from string, file, individual elements).\
**Parse and convert** strings to integers, floats, ...\
**Merge / limit** lists.

## More utilities

Please check the [node list](./wiki/node_list.md).

# Documentation

> [!TIP]
> All nodes in this extension has been adjusted with custom tooltips.\
> By simply **moving the mouse pointer over** a node or its inputs / widgets / outputs, you can get useful **contextual information**.

In addition, more detailed information in the [wiki](./wiki/):

- [Node list](./wiki/node_list.md)
- [Node reference](./wiki/node%20reference/)
- [Tutorials](./wiki/tutorials/)
- [Examples](./wiki/examples/)

# Installation

Preferred installation method via the [ComfyUI Manager](https://github.com/ltdrdata/ComfyUI-Manager): search and install `ComfyLab Pack`

Manual installation (from the ComfyUI directory):

```bash
source venv/bin/activate # adjust to your env
cd custom_nodes
git clone https://github.com/bugltd/ComfyLab-Pack.git
cd ComfyLab-Pack
pip install -r requirements.txt
cd ../..
deactivate
# run ComfyUI as usual
```
