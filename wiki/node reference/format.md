# Node reference: Format (String / Multiline)

**[>> Link to the tutorials](../tutorials/Format/)**

## Overview

The `Format` nodes are very simple yet powerful nodes, that are based on the **standard Python string `format()` method**.\
They exist in 2 flavors: `String` or `Multiline`.

They are useful to create a string from a template, and **any number of inputs**.\
Inputs can be of the following ComfyUI types: `STRING`, `INT`, `FLOAT`, `BOOLEAN`.

## How to use

Here we will just cover the most basic usage, but please note that Python string `format()` allows to do very interesting things, beyond the standard string replacement: padding, truncating, ...

### Simple usage

The node takes any number of inputs, that are automatically incremented: `arg0`, `arg1`, ...

Given the following template: `first arg by name: {arg0}, second by index: {1}`, and 2 input strings (`tata` and `toto`), we will get the resulting string: `first arg by name: tata, second by index: toto`.

Here we see that **we can reference the inputs either by their name (`argN`), or by their index (starting at 0)**.\
Straightforward, isn't it?

This way, it's **very simple to concatenate 2 strings, append text to a string, ... many operations in one single node!**

And last but not least: at stated above, it can take **other types than strings: integer, float, boolean** (and surely others).

### Going further

For more details and advanced techniques, you can check:

- [the tutorials of the `Format` nodes](../tutorials/Format/)
- [a guide with different possible techniques (padding, ...)](https://pyformat.info/)
- [format specification mini-language (python.org)](https://docs.python.org/3/library/string.html#format-specification-mini-language)

## Inputs / Widgets / Outputs

### Inputs (unlimited)

| input name |            type             | description | comment                            |
| :--------: | :-------------------------: | :---------: | :--------------------------------- |
|    arg0    | STRING, INT, FLOAT, BOOLEAN | input value | can also be referenced by index: 0 |
|    ...     |                             |             |                                    |
|    argN    | STRING, INT, FLOAT, BOOLEAN | input value | can also be referenced by index: N |

### Widgets

| widget name |  type  |   description   | comment |
| :---------: | :----: | :-------------: | :------ |
|   format    | STRING | template string |         |

### Outputs

| output name |  type  |        description         | comment |
| :---------: | :----: | :------------------------: | :------ |
|  formatted  | STRING | result string after format |         |
