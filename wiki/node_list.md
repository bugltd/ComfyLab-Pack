# Node list

All extension nodes, organized by category.

## XY Plot

|           Node name            |                Description                 |                                                                       Reference                                                                        |                                                                                               Tutorial                                                                                               |
| :----------------------------: | :----------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|       **XY Plot: Queue**       | queue dim1 / dim2 input lists into values  | [core concepts](./node%20reference/xy%20plot/0%20-%20core%20concepts.md)<br/>[reference](./node%20reference/xy%20plot/1%20-%20queue%20and%20render.md) | [tutorial #1](./tutorials/XY%20Plot/1%20-%20the%20basics/)<br/>[tutorial #2](./tutorials/XY%20Plot/2%20-%20pimp%20my%20grid/)<br/>[tutorial #3](./tutorials/XY%20Plot/3%20-%20complex%20variations/) |
|      **XY Plot: Render**       |          render the XY Plot grid           | [core concepts](./node%20reference/xy%20plot/0%20-%20core%20concepts.md)<br/>[reference](./node%20reference/xy%20plot/1%20-%20queue%20and%20render.md) | [tutorial #1](./tutorials/XY%20Plot/1%20-%20the%20basics/)<br/>[tutorial #2](./tutorials/XY%20Plot/2%20-%20pimp%20my%20grid/)<br/>[tutorial #3](./tutorials/XY%20Plot/3%20-%20complex%20variations/) |
|     **Plot Config: Grid**      |             configure the grid             |                                          [reference](./node%20reference/xy%20plot/2%20-%20config%20nodes.md)                                           |                                [tutorial #2](./tutorials/XY%20Plot/2%20-%20pimp%20my%20grid/)<br/>[tutorial #3](./tutorials/XY%20Plot/3%20-%20complex%20variations/)                                 |
| **Plot Config: Header/Footer** |   configure either page header or footer   |                                          [reference](./node%20reference/xy%20plot/2%20-%20config%20nodes.md)                                           |                                [tutorial #2](./tutorials/XY%20Plot/2%20-%20pimp%20my%20grid/)<br/>[tutorial #3](./tutorials/XY%20Plot/3%20-%20complex%20variations/)                                 |
|    **XY Plot: Split Data**     | split XY Plot data into page index / count |                                          [reference](./node%20reference/xy%20plot/2%20-%20config%20nodes.md)                                           |                                [tutorial #2](./tutorials/XY%20Plot/2%20-%20pimp%20my%20grid/)<br/>[tutorial #3](./tutorials/XY%20Plot/3%20-%20complex%20variations/)                                 |

## Output Config

|               Node name               |                    Description                    |                     Reference                      |                                                                          Tutorial                                                                           |
| :-----------------------------------: | :-----------------------------------------------: | :------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------: |
|        **Output Config: Load**        |  create dynamic outputs from a local config file  | [reference](./node%20reference/output%20config.md) | [tutorial #1](<./tutorials/Output%20Config/1%20-%20simple%20(value%20and%20label)/>)<br/>[tutorial #2](./tutorials/Output%20Config/2%20-%20more%20options/) |
| **Output Config: Retrieve (backend)** | create dynamic outputs from a backend config file | [reference](./node%20reference/output%20config.md) | [tutorial #1](<./tutorials/Output%20Config/1%20-%20simple%20(value%20and%20label)/>)<br/>[tutorial #2](./tutorials/Output%20Config/2%20-%20more%20options/) |

## Utils

|          Node name           |                                               Description                                                |                 Reference                 | Tutorial |
| :--------------------------: | :------------------------------------------------------------------------------------------------------: | :---------------------------------------: | :------: |
|      **Format: String**      |                                format a string, with any number of inputs                                | [reference](./node%20reference/format.md) |          |
|    **Format: Multiline**     |                                format a string, with any number of inputs                                | [reference](./node%20reference/format.md) |          |
|    **Load Image (RGBA)**     |              load an image as RGBA, with 2 different available methods to generate the mask              |                                           |          |
|      **Save Text File**      |                                       save text content to a file                                        |                                           |          |
|          **Sleep**           |                             delay execution for the given amount of seconds                              |                                           |          |
|      **Convert to Any**      |                                   convert any value to type Any ('\*)                                    |                                           |          |
| **Resolution to Dimensions** | split a resolution (as string, ex. '1024x1024') to dimensions,<br/>optionally multiplied by scale factor |                                           |          |

## List

|           Node name           |                                                     Description                                                     | Reference | Tutorial |
| :---------------------------: | :-----------------------------------------------------------------------------------------------------------------: | :-------: | :------: |
|     **List: from String**     | split a single string into elements delimited by a separator<br/>optionally convert values to integers, flotas, ... |           |          |
|   **List: from Multiline**    |      split a multiline string, each line being a value<br/>optionally convert values to integers, flotas, ...       |           |          |
| **List: from File (backend)** |                     read a multiline text file from backend,<br/>and send its content as a list                     |           |          |
|    **List: from Elements**    |                                create a list from any number of individual elements                                 |           |          |
|        **List: Merge**        |                                         merge any number of lists into one                                          |           |          |
|        **List: Limit**        |                                             limit list to a given size                                              |           |          |
|    **List: Random Seeds**     |                                            create a list of random seeds                                            |           |          |
|     **List: Checkpoints**     |                              create a list of checkpoint file names (multi-selection)                               |           |          |
|        **List: LoRAs**        |                                 create a list of LoRA file names (multi-selection)                                  |           |          |
|      **List: Samplers**       |                                  create a list of sampler names (multi-selection)                                   |           |          |
|     **List: Schedulers**      |                                 create a list of scheduler names (multi-selection)                                  |           |          |

## Queue

|     Node name     |                          Description                           | Reference | Tutorial |
| :---------------: | :------------------------------------------------------------: | :-------: | :------: |
| **Generic Queue** |             loop through all values of input list              |           |          |
|  **File Queue**   |    loop through all files in folder matching the pattern(s)    |           |          |
|  **Image Queue**  | loop through all image files in folder matching the pattern(s) |           |          |

## Input

|      Node name       |                         Description                          | Reference | Tutorial |
| :------------------: | :----------------------------------------------------------: | :-------: | :------: |
|  **Input: Folder**   | simple input for a folder,<br/>optionally checking it exists |           |          |
|  **Input: Integer**  |              simple node to provide an integer               |           |          |
|   **Input: Float**   |                simple node to provide a float                |           |          |
|  **Input: Boolean**  |               simple node to provide a boolean               |           |          |
|  **Input: String**   |               simple node to provide a string                |           |          |
| **Input: Multiline** | input a multiline string, with comments optionally stripped  |           |          |
