from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import textwrap
import math
from dataclasses import asdict

from .plot_data import PlotConfigGridData, PlotConfigHFData, PlotVars

STATIC_DIR = (Path(__file__).parent.parent.parent.parent / 'static').resolve()


class Grid:
    def __init__(
        self,
        plot_config_grid: PlotConfigGridData,
        plot_config_header: PlotConfigHFData = None,
        plot_config_footer: PlotConfigHFData = None,
    ):
        self.config_grid = plot_config_grid
        self.config_header = plot_config_header
        self.config_footer = plot_config_footer
        self.headers = ([], [])
        self.dims = (0, 0)

    def make(
        self,
        image_matrix: list[list[Image.Image]],
        col_headers: list[str],
        row_headers: list[str],
        plot_vars: PlotVars,
    ) -> Image.Image:
        # keep a track to reuse later
        self.headers = (col_headers, row_headers)
        self.dims = (len(col_headers), len(row_headers))
        cols, rows = self.dims
        self.max_cell_size = self._calc_max_cell_size(image_matrix)

        # build the grid image
        grid_size = (
            self.max_cell_size[0] * cols + (cols - 1) * self.config_grid.gap,
            self.max_cell_size[1] * rows + (rows - 1) * self.config_grid.gap,
        )
        grid_image = self._create_image(grid_size, self.config_grid.background_color)

        for r, row in enumerate(image_matrix):
            for c, image in enumerate(row):
                x = c * (self.max_cell_size[0] + self.config_grid.gap) + int(
                    (self.max_cell_size[0] - image.size[0]) / 2
                )
                y = r * (self.max_cell_size[1] + self.config_grid.gap) + int(
                    (self.max_cell_size[1] - image.size[1]) / 2
                )
                grid_image.paste(image, (x, y))

        # add headers; if header format for dim1/dim2 is empty, they will be silently ignored
        grid_image = self._add_headers(grid_image)

        # add page header / footer
        grid_image = self._add_page_hf(grid_image, plot_vars)

        return grid_image

    def _calc_max_cell_size(
        self, image_matrix: list[list[Image.Image]]
    ) -> tuple[int, int]:
        # scan all images to get max width / max height
        max_size = (-1, -1)
        # TODO: allow different row heights / col widths?
        for row in image_matrix:
            for image in row:
                w, h = image.size
                max_size = (max(max_size[0], w), max(max_size[1], h))

        return max_size

    def _create_image(self, size: tuple[int, int], bg_color: str) -> Image.Image:
        if bg_color == 'transparent':
            image = Image.new('RGBA', (size[0], size[1]))
        else:
            image = Image.new(
                'RGB',
                (size[0], size[1]),
                color=bg_color,
            )
        return image

    def _add_headers(self, grid_image: Image.Image):
        # normalize the headers, to respect the wrap configs
        self.headers = (
            self._normalize_headers(self.headers[0], self.config_grid.wrap_col_headers),
            self._normalize_headers(self.headers[1], self.config_grid.wrap_row_headers),
        )

        # load font
        font = self._load_font(self.config_grid.font, self.config_grid.font_size)

        # calculate height and width of headers at top and left
        top_margin, left_margin = self._calc_headers_margins(font)

        # build the new image and paste the existing grid
        image = self._create_image(
            (grid_image.size[0] + left_margin, grid_image.size[1] + top_margin),
            self.config_grid.background_color,
        )
        draw = ImageDraw.Draw(image)
        draw.font = font
        image.paste(
            grid_image,
            (image.size[0] - grid_image.size[0], image.size[1] - grid_image.size[1]),
        )

        # add the headers
        for col, header in enumerate(self.headers[0]):
            pos_x = (
                left_margin
                + col * (self.config_grid.gap + self.max_cell_size[0])
                + self.max_cell_size[0] / 2
            )
            pos_y = top_margin / 2
            self._draw_header(
                draw, (pos_x, pos_y), header, font, self.config_grid.font_color
            )
        for row, header in enumerate(self.headers[1]):
            pos_x = left_margin / 2
            pos_y = (
                top_margin
                + row * (self.config_grid.gap + self.max_cell_size[1])
                + self.max_cell_size[1] / 2
            )
            self._draw_header(
                draw, (pos_x, pos_y), header, font, self.config_grid.font_color
            )
        return image

    def _load_font(self, font_name: str, font_size: int) -> ImageFont:
        full_path = (
            STATIC_DIR / font_name
            if not Path(font_name).is_absolute()
            else Path(font_name)
        )
        try:
            full_path = full_path.resolve(strict=True)
        except:
            raise Exception("TTF font not found: '{}'".format(full_path))
        font = ImageFont.truetype(str(full_path), size=font_size)
        return font

    def _normalize_headers(self, headers: list[str], wrap: int) -> list[str]:
        normalized = []
        for header in headers:
            header = header.replace(r'\n', '\n')
            if wrap > 0:
                header = textwrap.fill(header, wrap, break_on_hyphens=True)
            normalized.append(header)
        return normalized

    def _calc_headers_margins(self, font: ImageFont):
        top_margin = 0
        for header in self.headers[0]:
            if header == '':
                continue
            lines = header.split('\n')
            top_margin = max(top_margin, math.ceil(len(lines) * font.size))
        # add padding if there is something to display
        if top_margin > 0:
            top_margin = top_margin + 2 * self.config_grid.pad_col_headers

        left_margin = 0
        for header in self.headers[1]:
            if header == '':
                continue
            for line in header.split('\n'):
                left_margin = max(left_margin, math.ceil(font.getlength(line)))
        # add padding if there is something to display
        if left_margin > 0:
            left_margin = left_margin + 2 * self.config_grid.pad_row_headers

        return (top_margin, left_margin)

    def _draw_header(
        self,
        draw: ImageDraw,
        pos: tuple[int, int],
        text: str,
        font: ImageFont,
        font_color,
    ):
        # see: https://github.com/python-pillow/Pillow/discussions/7914#discussioncomment-8950499
        draw.multiline_text(
            pos, text, font=font, fill=font_color, align='center', anchor='mm'
        )

    def _add_page_hf(self, grid_image: Image.Image, plot_vars: PlotVars) -> Image.Image:
        grid_width, grid_height = grid_image.size
        header_height, header_image = self._draw_page_hf(
            grid_width, plot_vars, self.config_header
        )
        footer_height, footer_image = self._draw_page_hf(
            grid_width, plot_vars, self.config_footer
        )

        # early exit
        if header_height + footer_height == 0:
            return grid_image

        # create a new image and paste grid and header / footer if applicable
        new_image = self._create_image(
            (grid_width, grid_height + header_height + footer_height),
            self.config_grid.background_color,
        )
        if header_image:
            new_image.paste(header_image, (0, 0))
        new_image.paste(grid_image, (0, header_height))
        if footer_image:
            new_image.paste(footer_image, (0, header_height + grid_height))

        return new_image

    def _draw_page_hf(
        self, width: int, plot_vars: PlotVars, config: PlotConfigHFData = None
    ) -> tuple[int, Image.Image]:
        # early exit
        if not config or (
            not config.text_left and not config.text_center and not config.text_right
        ):
            return (0, None)

        # calc height
        font = self._load_font(config.font, config.font_size)
        texts = [
            self._apply_template(template, plot_vars)
            for template in [config.text_left, config.text_center, config.text_right]
        ]
        height = 0
        for text in texts:
            lines = text.split('\n')
            height = max(height, math.ceil(len(lines) * font.size + 2 * config.padding))

        # create the image
        # if bg color is 'transparent', then keep the same as grid
        image = self._create_image(
            (width, height),
            self.config_grid.background_color
            if config.background_color == 'transparent'
            else config.background_color,
        )

        # calculate the text position
        texts_pos = [
            self._calc_page_hf_text_pos(align, (width, height), config.padding)
            for align in ['left', 'center', 'right']
        ]

        # draw the texts
        draw = ImageDraw.Draw(image)
        draw.font = font
        for i, text in enumerate(texts):
            if not text:
                continue
            # see: https://github.com/python-pillow/Pillow/discussions/7914#discussioncomment-8950499
            # text anchors: https://pillow.readthedocs.io/en/stable/handbook/text-anchors.html
            draw.multiline_text(
                texts_pos[i][0],
                text,
                font=font,
                fill=config.font_color,
                align=texts_pos[i][1],
                anchor=texts_pos[i][2],
            )

        return (height, image)

    def _apply_template(self, template: str, plot_vars: PlotVars) -> str:
        text = template.replace(r'\n', '\n')
        try:
            text = text.format(**asdict(plot_vars))
        except KeyError as e:
            text = "Error: unknown variable '{}'".format(e.args[0])
        return text

    def _calc_page_hf_text_pos(
        self, align: str, size: tuple[int, int], padding: int
    ) -> tuple[tuple[int, int], str, str]:
        # calculate the text position
        match align:
            case 'left':
                pos = (padding, size[1] // 2)
                anchor = 'lm'
            case 'right':
                pos = (size[0] - padding, size[1] // 2)
                anchor = 'rm'
            case 'center':
                pos = (size[0] // 2, size[1] // 2)
                anchor = 'mm'
            case _:
                # probably useless
                raise ValueError(
                    "invalid align value '{}': must be 'left', 'right' or 'center".format(
                        align
                    )
                )
        return (pos, align, anchor)
