from typing import Any
from dataclasses import dataclass


# store useful values associated with a dim
@dataclass
class DimData:
    index: int
    length: int
    value: Any


# data sent from XYPlotQueue to XYPlotRender
@dataclass
class XYPlotQueueData:
    index: int
    current_page: str
    total_pages: int
    complete: bool
    dim1: DimData
    dim2: DimData


@dataclass
class PlotConfigGridData:
    gap: int = 20
    background_color: str = '#b9b9b9'
    font: str = 'Roboto-Regular.ttf'
    font_size: int = 50
    font_color: str = '#444'
    pad_col_headers: int = 30
    pad_row_headers: int = 50
    wrap_col_headers: int = 0
    wrap_row_headers: int = 0


@dataclass
class PlotConfigHFData:
    text_left: str = ''
    text_center: str = ''
    text_right: str = ''
    background_color: str = 'transparent'
    font: str = 'Roboto-Bold.ttf'
    font_size: int = 60
    font_color: str = '#222'
    padding: int = 30


@dataclass
class PlotVars:
    current_page: int
    total_pages: int
