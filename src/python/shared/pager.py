from types import SimpleNamespace
import torch  # type: ignore
from .utils import tensor_to_pillow, pillow_to_tensor
from .plot_data import (
    XYPlotQueueData,
    PlotConfigGridData,
    PlotConfigHFData,
    PlotVars,
)
from .grid import Grid


class Pager:
    def __init__(
        self,
        xy_plot_data: XYPlotQueueData,
        header_formats: tuple[str, str],
        dim1_as_rows: bool = True,
    ):
        self.dim1_as_rows = dim1_as_rows
        self.header_formats = header_formats
        self.dim1 = SimpleNamespace(
            **{'length': xy_plot_data.dim1.length, 'headers': []}
        )
        self.dim2 = SimpleNamespace(
            **{'length': xy_plot_data.dim2.length, 'headers': []}
        )
        # initialize the 2D list
        if dim1_as_rows:
            self.image_matrix = [
                [None] * self.dim2.length for i in range(self.dim1.length)
            ]
        else:
            self.image_matrix = [
                [None] * self.dim1.length for i in range(self.dim2.length)
            ]
        self.accumulated = 0

    @property
    def expected(self) -> int:
        return self.dim1.length * self.dim2.length

    @property
    def complete(self) -> bool:
        return self.accumulated >= self.expected

    # calculate the coordinates in dim1 and dim2, given a sequential index
    def get_coords(self, index: int) -> tuple[int, int]:
        if self.dim1_as_rows:
            return (int(index / self.dim2.length), int(index % self.dim2.length))
        else:
            return (int(index % self.dim2.length), int(index / self.dim2.length))

    def add(self, xy_plot_data: XYPlotQueueData, tensor: torch.Tensor):
        # store dim1 / dim2 headers if not known yet
        # TODO: catch exception and set default header?
        if xy_plot_data.dim1.index >= len(self.dim1.headers):
            self.dim1.headers.append(
                self.header_formats[0].format(dim1=xy_plot_data.dim1.value)
            )
        if xy_plot_data.dim2.index >= len(self.dim2.headers):
            self.dim2.headers.append(
                self.header_formats[1].format(dim2=xy_plot_data.dim2.value)
            )

        # store the tensor as image
        x, y = self.get_coords(xy_plot_data.index)
        self.image_matrix[x][y] = tensor_to_pillow(tensor)
        self.accumulated += 1

        # return complete status
        return self.complete

    def make_grid(
        self,
        plot_vars: PlotVars,
        plot_config_grid: PlotConfigGridData = PlotConfigGridData(),
        plot_config_header: PlotConfigHFData = None,
        plot_config_footer: PlotConfigHFData = None,
    ) -> torch.Tensor:
        grid = Grid(plot_config_grid, plot_config_header, plot_config_footer)
        if self.dim1_as_rows:
            grid_image = grid.make(
                self.image_matrix, self.dim2.headers, self.dim1.headers, plot_vars
            )
        else:
            grid_image = grid.make(
                self.image_matrix, self.dim1.headers, self.dim2.headers, plot_vars
            )
        return pillow_to_tensor(grid_image)
