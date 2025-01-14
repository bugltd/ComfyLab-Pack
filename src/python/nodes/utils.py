from typing import Any
import time
import os
from PIL import Image
import numpy as np
import torch

import folder_paths

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
