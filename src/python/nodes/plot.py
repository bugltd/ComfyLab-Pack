from comfy_execution.graph import ExecutionBlocker  # type: ignore
import torch  # type: ignore
from math import ceil

from ..collection.register_nodes import register_node
from ..shared.utils import ANY_TYPE
from ..shared.plot_data import (
    DimData,
    XYPlotQueueData,
    PlotConfigHFData,
    PlotConfigGridData,
    PlotVars,
)
from ..shared.pager import Pager

# common tooltips
TOOLTIP_XY_PLOT_DATA = (
    'data sent by the queue, to indicate the cuttent state of processing'
)
TOOLTIP_COLOR = (
    "can be either a color name ('red'), or the RGB hex notation ('#b9b9b9', '#aaa')"
)
TOOLTIP_FONT = "font: either one of 'Roboto-Regular.ttf' / 'Roboto-Bold.ttf' / 'Roboto-Italic.ttf' / 'Roboto-BoldItalic.ttf',\nor the full path to a locally-installed TTF font"
TOOLTIP_FONT_SIZE = 'font size'
TOOLTIP_FONT_COLOR = 'font color, ' + TOOLTIP_COLOR
TOOLTIP_HF_PLACEHOLDERS = (
    'the following placeholders are accepted: {current_page}, {total_pages}'
)
TOOLTIP_PLOT_CONFIG_GRID = 'plot configuration for the grid'


@register_node('XY Plot: Queue', 'plot')
class XYPlotQueue:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'dim1': (
                    'LIST',
                    {
                        'tooltip': 'list of values, processed by queue as the 1st dimension\ntip: associate slow operation, like loading checkpoint, to dim1, to ensure better performance'
                    },
                ),
            },
            'optional': {
                'dim2': (
                    'LIST',
                    {
                        'tooltip': 'optional: list of values, processed by queue as the 2nd dimension'
                    },
                ),
                'index': ('QUEUE_STATUS', {'tooltip': 'current queue status'}),
                'max_dim1_per_page': (
                    'INT',
                    {
                        'default': 0,
                        'min': 0,
                        'tooltip': 'optional: if > 0, max number of dim1 values per page',
                    },
                ),
                'max_dim2_per_page': (
                    'INT',
                    {
                        'default': 0,
                        'min': 0,
                        'tooltip': 'optional: if > 0, max number of dim2 values per page',
                    },
                ),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('XY_PLOT_DATA', ANY_TYPE, ANY_TYPE)
    RETURN_NAMES = ('xy_plot_data', 'dim1_value', 'dim2_value')
    OUTPUT_TOOLTIPS = (
        TOOLTIP_XY_PLOT_DATA,
        'dim1 value (not typed)',
        'dim2 value (not typed)',
    )
    DESCRIPTION = 'Loop through all values of dim1, optionally combined with dim2 values, and send them to outputs.\nIMPORTANT: for a given dim1 value, all dim2 values are first iterated, before going to the next dim1 value.\nSo it is advised to associate slow operations (e.g. loading checkpoints) to dim1, to ensure better performance.'

    def run(
        self,
        dim1: list[str],
        max_dim1_per_page: int,
        max_dim2_per_page: int,
        index: int,
        dim2: list[str] = [''],
    ):
        if len(dim2) == 0:
            dim2 = ['']

        # to simplify code below
        size = (len(dim1), len(dim2))
        dim1_limited = max_dim1_per_page > 0 and max_dim1_per_page < size[0]
        dim2_limited = max_dim2_per_page > 0 and max_dim2_per_page < size[1]

        # calculate total
        total = size[0] * size[1]

        # check if we have finished
        complete = index == total - 1

        # max page dimensions, but not necessarily the current page ones: the last one may be smaller
        max_page_dims = (
            max_dim1_per_page if dim1_limited else size[0],
            max_dim2_per_page if dim2_limited else size[1],
        )

        # page index and total nb of pages
        total_pages = (
            ceil(size[0] / max_page_dims[0]),
            ceil(size[1] / max_page_dims[1]),
        )
        # compute the index and dimension of the current page for dim1 first
        current_page_index_dim1 = int(index / (size[1] * max_page_dims[0]))
        current_page_dims_dim1 = min(
            max_page_dims[0], size[0] - current_page_index_dim1 * max_page_dims[0]
        )

        # compute the index and dimension of the current page for dim2
        current_page = (
            current_page_index_dim1,
            int(
                (index - current_page_index_dim1 * size[1] * max_page_dims[0])
                / (current_page_dims_dim1 * max_page_dims[1])
            )
            % size[1],
        )
        current_page_dims = (
            current_page_dims_dim1,
            min(max_page_dims[1], size[1] - current_page[1] * max_page_dims[1]),
        )

        # sequential index and dim1/dim2 indexes in current page
        index_in_page_seq = (
            index
            - current_page[0] * size[1] * max_page_dims[0]
            - current_page[1] * current_page_dims[0] * max_page_dims[1]
        )
        index_in_page = (
            int(index_in_page_seq / current_page_dims[1]),
            int(index_in_page_seq % current_page_dims[1]),
        )

        # get value from each list, given the paged index
        values = (
            dim1[
                int(index_in_page_seq / current_page_dims[1])
                + current_page[0] * max_page_dims[0]
            ],
            dim2[
                int(index_in_page_seq % current_page_dims[1])
                + current_page[1] * max_page_dims[1]
            ],
        )

        # build data sent to XYPlotRender
        xy_plot_data = XYPlotQueueData(
            index_in_page_seq,
            current_page[0] * total_pages[1] + current_page[1],
            total_pages[0] * total_pages[1],
            complete,
            DimData(index_in_page[0], current_page_dims[0], values[0]),
            DimData(index_in_page[1], current_page_dims[1], values[1]),
        )

        return {
            'result': (xy_plot_data, values[0], values[1]),
            'ui': {'index': [index], 'total': [total]},
        }


@register_node('XY Plot: Render', 'plot')
class XYPlotRender:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'xy_plot_data': ('XY_PLOT_DATA', {'tooltip': TOOLTIP_XY_PLOT_DATA}),
                'image': ('IMAGE',),
                'dim1_header_format': (
                    'STRING',
                    {
                        'default': '{dim1}',
                        'tooltip': "temoplate text to be displayed as dim1 header.\nthe '{dim1'} placeholder will be replaced by the current value.\nUse '\\n' for multiline text.",
                    },
                ),
                'dim2_header_format': (
                    'STRING',
                    {
                        'default': '{dim2}',
                        'tooltip': "temoplate text to be displayed as dim2 header.\nthe '{dim2'} placeholder will be replaced by the current value.\nUse '\\n' for multiline text.",
                    },
                ),
                'direction': (
                    'BOOLEAN',
                    {
                        'default': True,
                        'label_on': 'dim1 as rows',
                        'label_off': 'dim1 as cols',
                        'tooltip': 'display dim1 values as rows or columns',
                    },
                ),
            },
            'optional': {
                'plot_config_grid': (
                    'PLOT_CONFIG_GRID',
                    {'tooltip': 'optional: ' + TOOLTIP_PLOT_CONFIG_GRID},
                ),
                'plot_config_header': (
                    'PLOT_CONFIG_HF',
                    {'tooltip': 'optional: plot configuration for the page header'},
                ),
                'plot_config_footer': (
                    'PLOT_CONFIG_HF',
                    {'tooltip': 'optional: plot configuration for the page footer'},
                ),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('IMAGE', 'IMAGE')
    RETURN_NAMES = ('grid', 'image')
    OUTPUT_TOOLTIPS = (
        'grid page',
        'individual image, as received in input',
    )
    DESCRIPTION = 'Render the generated images as grids.\nOptional configuration is available to customize the look of the grid, and page header / footer.'

    # Pager object, to hold each individual images and build the grid
    pager = None

    def run(
        self,
        xy_plot_data: XYPlotQueueData,
        image: torch.Tensor,
        dim1_header_format: str,
        dim2_header_format: str,
        direction: bool,
        plot_config_grid=PlotConfigGridData(),
        plot_config_header=None,
        plot_config_footer=None,
    ):
        if xy_plot_data.index == 0:
            self.pager = Pager(
                xy_plot_data, (dim1_header_format, dim2_header_format), direction
            )

        # add image to pager
        self.pager.add(xy_plot_data, image)

        # check if page is complete
        if not self.pager.complete:
            # block downstream nodes for grid output, just send the individual image
            return {'result': (ExecutionBlocker(None), image)}
        else:
            grid = self.pager.make_grid(
                PlotVars(xy_plot_data.current_page + 1, xy_plot_data.total_pages),
                plot_config_grid,
                plot_config_header,
                plot_config_footer,
            )
            # complete, send grid + individual image
            return (
                grid,
                image,
            )


@register_node('Plot Config: Grid', 'plot')
class PlotConfigGrid:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'gap': (
                    'INT',
                    {'default': 20, 'min': 0, 'tooltip': 'gap between grid cells'},
                ),
                'background_color': (
                    'STRING',
                    {
                        'default': '#b9b9b9',
                        'tooltip': 'background color, '
                        + TOOLTIP_COLOR
                        + "\nuse the special value 'transparent' to generate a RGBA image",
                    },
                ),
                'font': (
                    'STRING',
                    {
                        'default': 'Roboto-Regular.ttf',
                        'tooltip': TOOLTIP_FONT,
                    },
                ),
                'font_size': (
                    'INT',
                    {'default': 50, 'min': 1, 'tooltip': TOOLTIP_FONT_SIZE},
                ),
                'font_color': (
                    'STRING',
                    {'default': '#444', 'tooltip': TOOLTIP_FONT_COLOR},
                ),
                'pad_col_headers': (
                    'INT',
                    {
                        'default': 30,
                        'min': 0,
                        'tooltip': 'vertical padding to apply to column headers',
                    },
                ),
                'pad_row_headers': (
                    'INT',
                    {
                        'default': 50,
                        'min': 0,
                        'tooltip': 'horizontal padding to apply to row headers',
                    },
                ),
                'wrap_col_headers': (
                    'INT',
                    {
                        'default': 0,
                        'min': 0,
                        'tooltip': 'if > 0, max number of characters in column headers before wrapping',
                    },
                ),
                'wrap_row_headers': (
                    'INT',
                    {
                        'default': 0,
                        'min': 0,
                        'tooltip': 'if > 0, max number of characters in row headers before wrapping',
                    },
                ),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('PLOT_CONFIG_GRID',)
    RETURN_NAMES = ('plot_config_grid',)
    OUTPUT_TOOLTIPS = (TOOLTIP_PLOT_CONFIG_GRID,)
    DESCRIPTION = 'Various options to customize the grid appearance.'

    def run(
        self,
        gap: int,
        background_color: str,
        font: str,
        font_size: int,
        font_color: str,
        pad_col_headers: int,
        pad_row_headers: int,
        wrap_col_headers: int,
        wrap_row_headers: int,
    ):
        plot_config_grid = PlotConfigGridData(
            gap=gap,
            background_color=background_color,
            font=font,
            font_size=font_size,
            font_color=font_color,
            pad_col_headers=pad_col_headers,
            pad_row_headers=pad_row_headers,
            wrap_col_headers=wrap_col_headers,
            wrap_row_headers=wrap_row_headers,
        )
        return (plot_config_grid,)


@register_node('Plot Config: Header/Footer', 'plot')
class PlotConfigHF:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'text_left': (
                    'STRING',
                    {
                        'default': '',
                        'tooltip': 'text to be displayed on the left of the page header or footer\n'
                        + TOOLTIP_HF_PLACEHOLDERS,
                    },
                ),
                'text_center': (
                    'STRING',
                    {
                        'default': '',
                        'tooltip': 'text to be displayed at the center of the page header or footer\n'
                        + TOOLTIP_HF_PLACEHOLDERS,
                    },
                ),
                'text_right': (
                    'STRING',
                    {
                        'default': '',
                        'tooltip': 'text to be displayed on the right of the page header or footer\n'
                        + TOOLTIP_HF_PLACEHOLDERS,
                    },
                ),
                'background_color': (
                    'STRING',
                    {
                        'default': 'transparent',
                        'tooltip': 'background color for the page header or footer, '
                        + TOOLTIP_COLOR
                        + "\nuse the special value 'transparent' to keep the grid background",
                    },
                ),
                'font': (
                    'STRING',
                    {'default': 'Roboto-Bold.ttf', 'tooltip': TOOLTIP_FONT},
                ),
                'font_size': (
                    'INT',
                    {'default': 60, 'min': 1, 'tooltip': TOOLTIP_FONT_SIZE},
                ),
                'font_color': (
                    'STRING',
                    {'default': '#222', 'tooltip': TOOLTIP_FONT_COLOR},
                ),
                'padding': (
                    'INT',
                    {
                        'default': 30,
                        'min': 0,
                        'tooltip': 'padding inside the page header or footer',
                    },
                ),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('PLOT_CONFIG_HF',)
    RETURN_NAMES = ('plot_config_hf',)
    OUTPUT_TOOLTIPS = ('plot configuration for either the page header or footer',)
    DESCRIPTION = (
        'Various options to customize the appearance of the page header or footer.'
    )

    def run(
        self,
        text_left: str,
        text_center: str,
        text_right: str,
        background_color: str,
        font: str,
        font_size: int,
        font_color: str,
        padding: int,
    ):
        plot_config_hf = PlotConfigHFData(
            text_left=text_left,
            text_center=text_center,
            text_right=text_right,
            font=font,
            background_color=background_color,
            font_size=font_size,
            font_color=font_color,
            padding=padding,
        )
        return (plot_config_hf,)


@register_node('XY Plot: Split Data', 'plot')
class XYPlotDataSplit:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'xy_plot_data': ('XY_PLOT_DATA', {'tooltip': TOOLTIP_XY_PLOT_DATA}),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('INT', 'INT', 'BOOLEAN')
    RETURN_NAMES = ('current_page', 'total_pages', 'complete')
    OUTPUT_TOOLTIPS = (
        'current page',
        'total number of pages',
        'is processing complete? (BOOLEAN)',
    )
    DESCRIPTION = 'Split the queue processing data into individual values.\nUseful to customize the filename during saving, for example.'

    def run(self, xy_plot_data: XYPlotQueueData):
        return (
            xy_plot_data.current_page + 1,
            xy_plot_data.total_pages,
            xy_plot_data.complete,
        )
