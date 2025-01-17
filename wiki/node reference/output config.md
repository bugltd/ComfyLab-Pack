# Node reference: Output Config

**[>> Link to the tutorials](../tutorials/Output%20Config/)**

## Overview

The `Output Config: Load` (and its backend counterpart, `Output Config: Retrieve`) is very different from other nodes: it allows you to load config files and **dynamically create any number of custom outputs**, that you can later connect to other nodes before executing the workflow.

It opens a whole range of use cases: whether you need to standardize tests (LoRA, ...), store a collection of usual use cases, or just share your configs with others, this node can certainly prove very useful.\
**You can define any number of outputs in it, to match your specific needs**.

A config file is a simple text file in one of the following formats: **JSON, JSON5 or YAML** (and also the unofficial JSONC, aka 'json with comments').

A config can be very simple:

```jsonc
{
	"seed": 618896223111156, // value can be set directly
	"cfg": {
		"value": 7.5, // or inside a dictionary, with the 'value' key
	},
	"steps": 40,
	// add all the outputs you need, name them as you wish
}
```

But it can be extended, **to customize the label, color, shape, and even the type of the output**.\
Here a more advanced example (written in YAML):

```yaml
seed:
  value: 618896223111156
  shape: box
  color_off: '#FF0000' # when not connected
  color_on: '#00FF00' # when connected
cfg:
  value: 7.5
  shape: circle # default shape
  color_off: blue # we can set colors by name
steps:
  value: 40
  shape: arrow
  color_off: '#dcb21a'
prompt:
  value: illuminated pirate ship sailing on a sea with a galaxy in the sky
  label: a basic prompt but a custom label
  shape: grid
  color_off: '#28cfcd'
checkpoint:
  value: sd_xl_base_1.0.safetensors
  type: '*' # '*' means any type, use it as a last resort
```

## Load vs Retrieve: which one should I choose?

The `Output Config: Load` and `Output Config: Retrieve` are very similar.\
The only difference is that the latter allows you to get a file located in the backend machine, while the former is to load a file where the browser is running.

**If your frontend (browser) is running on the same machine as the backend (as probably many of us), you certainly should choose the `Load` version**: it is more interactive and easier to use.\
The `Retrieve` version is probably only useful in some rare cases, but it's here if needed.

## Widgets

### Output Config: Load

|    widget label    |  type  |                      description                      | comment                                                                                           |
| :----------------: | :----: | :---------------------------------------------------: | :------------------------------------------------------------------------------------------------ |
| Load output config | button | get and validate the file<br/>then create the outputs |                                                                                                   |
|   display errors   | combo  |                 how to display errors                 | available options:<br/>- in browser console (F12)<br/>- in a popup (default)<br/>- do not display |
|    show config     | toggle |             show / hide the file preview              |                                                                                                   |

### Output Config: Retrieve (backend)

|        widget label         |  type  |                      description                      | comment                                                                                           |
| :-------------------------: | :----: | :---------------------------------------------------: | :------------------------------------------------------------------------------------------------ |
| JSON or YAML file (backend) |  text  |  full path to the config file<br/>in backend machine  |                                                                                                   |
|   Retrieve output config    | button | get and validate the file<br/>then create the outputs |                                                                                                   |
|       display errors        | combo  |                 how to display errors                 | available options:<br/>- in browser console (F12)<br/>- in a popup (default)<br/>- do not display |
|         show config         | toggle |             show / hide the file preview              |                                                                                                   |
