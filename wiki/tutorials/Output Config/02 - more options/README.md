# Tutorials / Output Config: 02 - more options

In [the first tutorial](<../01%20-%20simple%20(value%20and%20label)/>), we have seen how to use and modify a config file to add any number of custom outputs, setting the value and optionally the label.

In this second tutorial, we are going to see more configuration options, and also how validation errors are handled. \
While I don't recommend to customize the color or shape too much, to preserve the standard look of ComfyUI, these options exist in the standard code so they are available for you to play with in your configs. Once again, your config, your choice!

If you have no time yet to follow it, you can jump to [the conclusion](#tldr--conclusion).

## Part 1 - Make it shine

### Init the workflow

We will start with the same workflow as in [the first tutorial](<../01%20-%20simple%20(value%20and%20label)/>), so you can either reuse it or download it from here (it's the same).

### Let's make our eyes bleed (a little)

Load any of the `config 01 - *` files into `Output Config: Load`.

![node detail](./details/result%2001.jpg)

That's a bit ugly, isn't it?! Try to connect / disconnect `seed`, to make the color change... isn't it beautiful (or not)?

The available options are:

- `shape`: either 'box', 'circle', 'arrow' or 'grid'
  - 'circle' is the default shape
- `color_off` / `color_on`: color when disconnected / connected
  - color values can be expressed in the traditional RGB hex way (`#dcb21a`), or by name (`blue`, `red`, ...)

Another option is available, `type`: it allows you to enforce the output type to any of the valid types, as described in [the official docs](https://docs.comfy.org/custom-nodes/custom_node_datatypes), including any custom type (like `CHEESE`). \
It is probably only useful for quite advanced and specific use cases. But please note it exists, if you need it.

However, we are going to make use of it, in a kind of 'hacky' way, just below.

## Part 2 - Any is the (magic and risky) key

### That won't work...

Load any of the `bad config 01 - *` files into `Output Config: Load`.

We have added the `checkpoint` and `sampler` outputs. Please adjust the value for `checkpoint` to your env, if SDXL is not available in your ComfyUI instance.

Now, try to connect them, to `Load Checkpoint` / ckpt_name and `KSampler` / sampler_name respectively. You can't. Why?

These 2 widgets expect a string, but not any string: a string that exists in the list.\
So defining our output as string, as it is implied by the quoted value, is not sufficient.

Let's see how we can remediate this.

### ... unless we play a bit

This time, load any of the `config 02 - *` files into `Output Config: Load`. Once again, adjust `checkpoint` to a model that exists in your ComfyUI instance.

Try to connect the `checkpoint` and `sampler` outputs, to `Load Checkpoint` / ckpt_name and `KSampler` / sampler_name.
This time it works, and we can run the workflow. Why?

We have enforced typing by setting `type: "*"`, which means "Any" in ComfyUI. By doing this, we bypass the type checks and say "don't worry, it will be fine".\
Indeed it was fine, because we have set values that are valid for these inputs. Otherwise, we would have faced an error during workflow execution.

For this reason, my humble piece of advice: **use `"*"` as a last resort**, and prefer standard types whenever you can.\
And also, obviously: **review and understand your config before applying it**, especially if you downloaded it from someone else. While it cannot do anything harmful (the config is strictly validated), you may encounter unexpected results if you don't.

However, as you can see, in some cases it can open locked doors, and make your config extremely versatile, covering many different use cases. You can apply this to virtually any sort of combo widgets: LoRA, ... as long as you ensure the values are valid.

## Part 3 (final) - validation errors

Last but not least, we need to cover one aspect you will most certainly face: validation errors.

The config must follow strict rules, checked before the outputs are created. For those interested, this validation is performed thanks to a JSON schema, that can be found [here](https://github.com/bugltd/ComfyLab-Pack/blob/doc/src/schema/config.output.schema.json).

To help you identify errors in your config, the `Output Config: Load` node can inform you about what failed.

That is the purpose of the widget: `display errors`. It can take one of these values:

- `in a popup`: will show a dialog in the UI
- `in browser console (F12)`: errors will be listed in the browser DevTools console, accessible by pressing F12 (on Firefox at least)
- `do not display`: explicit

If you want to test, load any of the `bad config 02 - *` files.

Result in popup:\
![node detail](./details/error%2001.jpg)

Result in browser console:\
![node detail](./details/error%2002.jpg)

And, of course, the status at the bottom of the node is updated accordingly:
![node detail](./details/error%2003.jpg)

## TL;DR / Conclusion

With this second tutorial, we have seen:

- the other available options: `shape`, `color_on`, `color_off`, `type`
- `type` is probably not useful is most cases, as the output type is deducted from the value: string, integer / float, boolean, list, ...
- however, sometimes we may need to use `type: "*"`, to bypass the typing checks (for combo widgets in particular)
- detailed validation errors can be displayed, to help you understand what needs to be corrected in your config

That's it! I hope you have found these tutorials interesting: I tried to cover all the important aspects of the `Output Config: Load` node, to give you all the keys to use it efficiently.

As you can see, it is very simple to use, but can be very versatile and useful, if you need to standardize your tests / use cases, share your configs with others, ...

Thank you for reading, now it's your turn to be creative and enjoy your configs!!!
