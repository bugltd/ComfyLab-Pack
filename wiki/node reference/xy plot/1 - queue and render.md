# Node reference / XY Plot: 1 - Queue and Render

## Node overview

<img src="./images/queue_render.jpg" alt="XY Plot standard nodes" width="80%">

## XY Plot: Queue

> [!IMPORTANT] > `dim` and `dim2` take lists as inputs, and sends each combination of values in outputs
>
> - as the node cannot anticipate what is the type of input list values, the outputs are set to type Any (`"*"`)
> - it means that you can connect the outputs everywhere
>   - but you must ensure that the type of data in input correspond to the expected in destination node
>   - **what you send is what you get**
>
> `dim1` and `dim2` are processed following the rule: **for a given `dim1` value, we process all values of `dim2` before switching to the next `dim1` value**
>
> the node will manage auto-queuing: ensure set **the queue size is set to 1**

For more detailed explanations, please check the [core concepts](./0%20-%20core%20concepts.md).

### Inputs / Widgets / Outputs

#### Inputs

| input name | type |       description       | comment |
| :--------: | :--: | :---------------------: | :------ |
|    dim1    | LIST |      input list #1      |         |
|    dim2    | LIST | optional: input list #2 |         |

#### Widgets

|    widget name     | type |        description         | comment        |
| :----------------: | :--: | :------------------------: | :------------- |
| dim1: max per page | INT  | pagination for dim1 values | `0` to disable |
| dim2: max per page | INT  | pagination for dim2 values | `0` to disable |

#### Outputs

| output name  |    type     |            description            | comment                     |
| :----------: | :---------: | :-------------------------------: | :-------------------------- |
| XY Plot data | XYPLOT_DATA |       queue processing data       | linked to `XY Plot: Render` |
|  dim1 value  |  ANY (`*`)  | list element from dim1 input list |                             |
|  dim2 value  |  ANY (`*`)  | list element from dim2 input list |                             |

## XY Plot: Render

`dim1: header format` and `dim2: header format`:

- enter here a template string, following the syntax of Python string `format()` method
- the `{dim1}` and `{dim2}` placeholders will be replaced by the current dim1 / dim2 value
- very handy if you want to prefix the row / column headers, for example:
  - if you have CFG values in dim1, by default the headers will be `7.5`, `8`, ...
  - just change the dim1 header format to `CFG: {dim1}` and you will get: `CFG: 7.5`, `CFG: 8`, ...
- there are plenty of advanced techniques, but you will probably not use them here
  - however if you want to learn more, you can check the [`Format` node reference](../format.md)

`direction`: whether dim1 values are displayed as rows, or columns

### Inputs / Widgets / Outputs

#### Inputs

|  input name  |       type       |                    description                    | comment                                  |
| :----------: | :--------------: | :-----------------------------------------------: | :--------------------------------------- |
| XY Plot data |   XYPLOT_DATA    |               queue processing data               | linked from `XY Plot: Queue`             |
|    image     |      IMAGE       | image generated by the subprocess (KSampler, ...) |                                          |
| config: grid | PLOT_CONFIG_GRID |           optional: grid configuration            | linked from `Plot Config: Grid`          |
| config: grid |  PLOT_CONFIG_HF  |        optional: page header configuration        | linked from `Plot Config: Header/Footer` |
| config: grid |  PLOT_CONFIG_HF  |        optional: page footer configuration        | linked from `Plot Config: Header/Footer` |

#### Widgets

|     widget name     |  type   |           description           | comment                                               |
| :-----------------: | :-----: | :-----------------------------: | :---------------------------------------------------- |
| dim1: header format | STRING  |      dim1 template string       | use placeholder `{dim1}` to insert current dim1 value |
| dim2: header format | STRING  |      dim2 template string       | use placeholder `{dim2}` to insert current dim2 value |
|      direction      | BOOLEAN | display dim1 as rows or columns |                                                       |

#### Outputs

| output name | type  |       description       | comment                                        |
| :---------: | :---: | :---------------------: | :--------------------------------------------- |
|    grid     | IMAGE |    generated grid(s)    | outputs when enough images have been collected |
|    image    | IMAGE | image received in input | individual image as received in input          |
