from typing import Any
import time
import os
from PIL import Image
import numpy as np
import torch  # type: ignore
import re
import math

import folder_paths  # type: ignore
import comfy.utils

from ..collection.register_nodes import register_node
from ..shared.utils import ANY_TYPE, pillow_to_tensor


@register_node('Format: String', 'utils')
class FormatString:
    """
    Format a string using any number of inputs
    """

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'format': (
                    'STRING',
                    {
                        'default': 'first arg by name: {arg0}, second by index: {1}',
                        'multiline': False,
                        'tooltip': "placeholders can be either '{arg0}', '{arg1}, ... or '{0}', '{1}', ...",
                    },
                ),
            }
        }

    @classmethod
    def VALIDATE_INPUTS(s, input_types):
        for t in input_types.values():
            if t not in ['STRING', 'INT', 'FLOAT', 'BOOLEAN']:
                return False
        return True

    FUNCTION = 'run'
    RETURN_TYPES = ('STRING',)
    RETURN_NAMES = ('formatted',)
    DESCRIPTION = "Format a string, with any number of inputs.\nPlaceholders can be either '{arg0}', '{arg1}, ... or '{0}', '{1}', ...\nInputs can be strings, integers, floats, booleans.\nSearch for 'python format' for all configuration options, there are many!"

    def run(self, format: str, **kw):
        # handle both index and name references
        output = format.format(*kw.values(), **kw)

        return (output,)


@register_node('Format: Multiline', 'utils')
class FormatMultiline:
    """
    Format a multiline string using any number of inputs
    """

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'format': (
                    'STRING',
                    {
                        'default': 'first arg by name: {arg0}\nsecond by index: {1}',
                        'multiline': True,
                        'tooltip': "placeholders can be either '{arg0}', '{arg1}, ... or '{0}', '{1}', ...",
                    },
                ),
            }
        }

    @classmethod
    def VALIDATE_INPUTS(s, input_types):
        for t in input_types.values():
            if t not in ['STRING', 'INT', 'FLOAT', 'BOOLEAN']:
                return False
        return True

    FUNCTION = 'run'
    RETURN_TYPES = ('STRING',)
    RETURN_NAMES = ('formatted',)
    DESCRIPTION = "Format a multiline string, with any number of inputs.\nPlaceholders can be either '{arg0}', '{arg1}, ... or '{0}', '{1}', ...\nInputs can be strings, integers, floats, booleans."

    def run(self, format: str, **kw):
        # handle both index and name references
        output = format.format(*kw.values(), **kw)

        return (output,)


@register_node('Load Image (RGBA)', 'utils')
class LoadImageRGBA:
    """Load an image as RGBA.

    - filename_ext: whether to return the filename with or without the extension.
    - mask_precision: either 'standard' or 'tensor'. Defines the way the mask is created.
        - 'standard' is like standard LoadImage
        - 'tensor' is less conservative
    """

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        input_dir = folder_paths.get_input_directory()
        files = [
            f
            for f in os.listdir(input_dir)
            if os.path.isfile(os.path.join(input_dir, f))
        ]
        return {
            'required': {
                'image': (sorted(files), {'image_upload': True}),
                'with_extension': (
                    'BOOLEAN',
                    {
                        'default': False,
                        'label_on': 'filename with ext',
                        'label_off': 'filename without ext',
                        'tooltip': 'output the filename with or without extension',
                    },
                ),
                'mask_precision': (
                    ['tensor', 'standard'],
                    {
                        'default': 'tensor',
                        'tooltip': "'standard' is like standard LoadImage, 'tensor' is less conservative",
                    },
                ),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('IMAGE', 'MASK', 'STRING')
    RETURN_NAMES = ('image', 'mask', 'filename')
    DESCRIPTION = 'Load an image as RGBA, with 2 different available methods to generate the mask.'

    def run(self, image, with_extension, mask_precision):
        img_path = folder_paths.get_annotated_filepath(image)
        img_pil = Image.open(img_path)

        # filename output
        filename = os.path.basename(img_path)
        if with_extension == False:
            filename = os.path.splitext(filename)[0]

        output_images = []
        output_masks = []

        # convert image to tensor
        output_image = pillow_to_tensor(img_pil)

        # create mask
        if mask_precision == 'standard':
            if 'A' in img_pil.getbands():
                output_mask = (
                    np.array(img_pil.getchannel('A')).astype(np.float32) / 255.0
                )
                output_mask = 1.0 - torch.from_numpy(output_mask)
            else:
                output_mask = torch.zeros(
                    (img_pil.size[1], img_pil.size[0]),
                    dtype=torch.float32,
                    device='cpu',
                )
        else:
            # another way to create mask, but seems less precise (which may be good)
            # https://stackoverflow.com/questions/70786249/pytorch-numpy-create-binary-mask-from-rgb-image
            image_sum = output_image.sum(axis=3)
            output_mask = torch.where(image_sum > 0, 1.0, 0.0)
            output_mask = 1.0 - output_mask

        output_images.append(output_image)
        output_masks.append(output_mask)

        return (output_image, output_mask, filename)


@register_node('Save Text File', 'utils')
class SaveTextFile:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'text': ('STRING',),
                'folder': ('STRING',),
                'basename': (
                    'STRING',
                    {
                        'tooltip': 'filename without extension, or with extension is no extension is set below'
                    },
                ),
                'extension': (
                    'STRING',
                    {
                        'default': 'txt',
                        'tooltip': 'if no extension is set here, basename should include one',
                    },
                ),
                'overwrite': ('BOOLEAN', {'default': True}),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = ()
    OUTPUT_NODE = True
    DESCRIPTION = 'Save text content to a file.\nIf no extension is set, basename is the filename.'

    def run(
        self, text: str, folder: str, basename: str, extension: str, overwrite: bool
    ):
        if extension and not extension.startswith('.'):
            extension = '.' + extension
        full_path = os.path.join(folder, basename + extension)

        if not os.path.exists(full_path) or overwrite:
            with open(full_path, 'w') as f:
                f.write(text)

        return ()


@register_node('Sleep', 'utils')
class Sleep:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'input': (ANY_TYPE, {}),
            },
            'optional': {
                'seconds': (
                    'FLOAT',
                    {
                        'default': 0.5,
                        'min': 0,
                        'step': 0.1,
                        'tooltip': 'nb of seconds to wait',
                    },
                ),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = (ANY_TYPE,)
    RETURN_NAMES = ('value',)
    DESCRIPTION = 'Delay execution for the given amount of seconds.'

    def run(self, input: Any, seconds: float):
        time.sleep(seconds)
        return (input,)


@register_node('Convert to Any', 'utils')
class ConvertToAny:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'value': (
                    ANY_TYPE,
                    {
                        'label': 'input value',
                        'tooltip': 'input value to convert to type Any',
                    },
                )
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = (ANY_TYPE,)
    RETURN_NAMES = ('value_any',)
    OUTPUT_TOOLTIPS = ("input value, converted to type Any ('*')",)
    DESCRIPTION = "Convert any value to type Any ('*).\nUseful to pipe to a combo widget, for example."

    def run(self, value: Any):
        return (value,)


@register_node('Resolution to Dimensions', 'utils')
class ResolutionToDims:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'resolution': (
                    'STRING',
                    {
                        'default': '1024x1024',
                        'tooltip': "resolution as string (ex. '1024x1024')",
                    },
                ),
                'scale_factor': (
                    'FLOAT',
                    {
                        'default': 1,
                        'step': 0.1,
                        'display': 'float',
                        'tooltip': 'dimension multiplier',
                    },
                ),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('INT', 'INT')
    RETURN_NAMES = ('width', 'height')
    OUTPUT_TOOLTIPS = ('width', 'height')
    DESCRIPTION = "Split a resolution (as string, ex. '1024x1024') to dimensions, optionally multiplied by scale factor."

    def run(self, resolution: str, scale_factor: float):
        m = re.search(r'^\s*(\d+)\s*x\s*(\d+)\s*$', resolution)
        if not m:
            raise ValueError('Invalid resolution')
        return (
            int(int(m.group(1)) * scale_factor),
            int(int(m.group(2)) * scale_factor),
        )


@register_node('Image: Downscale to Total Pixels', 'utils')
class ImageDownscaleToTotalPixels:
    upscale_methods = ['nearest-exact', 'bilinear', 'area', 'bicubic', 'lanczos']

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'image': ('IMAGE',),
                'upscale_method': (
                    s.upscale_methods,
                    {'default': 'lanczos', 'tooltip': 'upscale method'},
                ),
                'megapixels': (
                    'FLOAT',
                    {
                        'default': '1',
                        'min': 0,
                        'max': 16,
                        'tooltip': 'target size in megapixels',
                    },
                ),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('IMAGE', 'INT', 'INT')
    RETURN_NAMES = ('image', 'width', 'height')
    OUTPUT_TOOLTIPS = ('downscaled image', 'width', 'height')
    DESCRIPTION = 'Downscale an image to match target size in megapuxels.\nIf the image is smaller than the target size, it is kept as is.'

    def run(self, image, upscale_method, megapixels):
        orig_samples = image.movedim(-1, 1)
        orig_width = orig_samples.shape[3]
        orig_height = orig_samples.shape[2]
        orig_total = orig_width * orig_height
        target_total = int(megapixels * 1024 * 1024)

        if orig_total <= target_total:
            return (image, orig_width, orig_height)

        scale_by = math.sqrt(target_total / orig_total)
        target_width = round(orig_width * scale_by)
        # we calculate height differently, to respect aspect ratio as much as possible
        target_height = round(orig_height * target_width / orig_width)

        s = comfy.utils.common_upscale(
            orig_samples, target_width, target_height, upscale_method, 'disabled'
        )
        s = s.movedim(1, -1)
        return (s, target_width, target_height)
