import hashlib
import math
import random
from pathlib import Path

import folder_paths  # type: ignore
from comfy.samplers import KSampler  # type: ignore

from ..collection.register_nodes import register_node


def convert_value(value: str, output_type: str):
    value = value.lower()
    if value == 'none':
        return None
    match output_type:
        case 'float':
            return float(value)
        case 'integer':
            return int(value)
        case 'boolean':
            if value in ('true', 'y', 'yes', 't', 'on', '1'):
                return True
            elif value in ('false', 'n', 'no', 'f', 'off', '0'):
                return False
            else:
                raise ValueError('invalid boolean value {}'.format(value))
        case _:
            return value


# common tooltips
TOOLTIP_STRIP_COMMENTS = "ignore lines starting with '#'"
TOOLTIP_CONVERT = 'convert each value to int, float or boolean\nfor booleans, values like true/false, yes/no, on/off, 0/1... are accepted.'
TOOLTIP_OUTPUT_SEPARATED = str(
    'list of values, splitted using the separator, optionally converted'
)
TOOLTIP_OUTPUT_MULTILINE = 'list of values (one per line, optionally converted)'
TOOLTIP_OUTPUT_COUNT = 'number of values'


@register_node('List: from String', 'list')
class ListFromString:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'string': (
                    'STRING',
                    {
                        'default': '',
                        'multiline': False,
                        'placeholder': 'single string',
                        'tooltip': 'single string to be splitted by separator',
                    },
                ),
                'separator': (
                    'STRING',
                    {
                        'default': ',',
                        'multiline': False,
                        'tooltip': 'element seperator (spaces surrounding values will be trimmed)',
                    },
                ),
                'convert': (
                    ['disabled', 'integer', 'float', 'boolean'],
                    {
                        'default': 'disabled',
                        'tooltip': TOOLTIP_CONVERT,
                    },
                ),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('LIST', 'INT')
    RETURN_NAMES = ('list', 'count')
    OUTPUT_TOOLTIPS = (
        TOOLTIP_OUTPUT_SEPARATED,
        TOOLTIP_OUTPUT_COUNT,
    )
    DESCRIPTION = 'Split a single string into elements delimited by a separator\nBy default the list elements are strings, but they can be converted.'

    def run(
        self,
        string: str,
        separator: str,
        convert: str,
    ):
        lines = string.split(separator)
        output = []
        for line in lines:
            line = line.strip()
            if convert != 'disabled':
                line = convert_value(line, convert)
            output.append(line)
        return (output, len(output))


@register_node('List: from Multiline', 'list')
class ListFromMultiline:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'load': (
                    'BTN',
                    {
                        'label': 'Load file',
                        'tooltip': 'load content from file\nor you can just paste / edit the content below',
                    },
                ),
                'strip_comments': (
                    'BOOLEAN',
                    {
                        'default': True,
                        'tooltip': TOOLTIP_STRIP_COMMENTS,
                    },
                ),
                'convert': (
                    ['disabled', 'integer', 'float', 'boolean'],
                    {
                        'default': 'disabled',
                        'tooltip': TOOLTIP_CONVERT,
                    },
                ),
                'multiline': (
                    'STRING',
                    {
                        'default': '',
                        'multiline': True,
                        'placeholder': "multiline text\noptionally lines starting with '#' can be ignored",
                    },
                ),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('LIST', 'INT')
    RETURN_NAMES = ('list', 'count')
    OUTPUT_TOOLTIPS = (
        TOOLTIP_OUTPUT_MULTILINE,
        TOOLTIP_OUTPUT_COUNT,
    )
    DESCRIPTION = "Split a multiline string, each line being a value\nBy default the list elemenrs are strings, but they can be converted\nOptionally, lines starting with '#' can be ignored."

    def run(
        self,
        load,
        strip_comments: bool,
        convert: str,
        multiline: str,
    ):
        lines = multiline.split('\n')
        output = []
        for line in lines:
            line = line.strip()
            if line != '' and (not line.startswith('#') or not strip_comments):
                if convert != 'disabled':
                    line = convert_value(line, convert)
                output.append(line)

        return (output, len(output))


@register_node('List: from File (backend)', 'list')
class ListFromFile:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'file_path': (
                    'STRING',
                    {
                        'default': '',
                        'placeholder': 'full path to file',
                        'tooltip': 'full path to file (backend)',
                    },
                ),
                'strip_comments': (
                    'BOOLEAN',
                    {'default': True, 'tooltip': TOOLTIP_STRIP_COMMENTS},
                ),
                'convert': (
                    ['disabled', 'integer', 'float', 'boolean'],
                    {
                        'default': 'disabled',
                        'tooltip': TOOLTIP_CONVERT,
                    },
                ),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('LIST', 'INT')
    RETURN_NAMES = ('list', 'count')
    OUTPUT_TOOLTIPS = (
        TOOLTIP_OUTPUT_MULTILINE,
        TOOLTIP_OUTPUT_COUNT,
    )
    DESCRIPTION = 'Read a multiline text file and send its content as a list\nBy default the list elements are strings, but they can be converted.'

    # force reloading in case the file has been changed externally
    # we cannot return float('NaN') as usually, otherwise nodes like ListMerge may not work properly
    # so we calculate the MD5 checksum, and add it to the returned dict, which is used to determine is the node has changed
    @classmethod
    def IS_CHANGED(cls, **kwargs):
        current = kwargs
        # try to open the open and calculate the checksum
        try:
            with open(current['file_path'], 'rb') as f:
                data = f.read()
                current['md5'] = hashlib.md5(data).hexdigest()
        except:
            pass
        return current

    def run(
        self,
        file_path: str,
        strip_comments: bool,
        convert: str,
    ):
        with open(
            file_path, 'rt'
        ) as f:  # that's the standard mode, but hey let's be rigorous
            lines = f.readlines()
        output = []
        for line in lines:
            line = line.strip()
            if line != '' and (not line.startswith('#') or not strip_comments):
                if convert != 'disabled':
                    line = convert_value(line, convert)
                output.append(line)

        return (output, len(output))


@register_node('List: from Elements', 'list')
class ListFromElements:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {'required': {}}

    FUNCTION = 'run'
    RETURN_TYPES = ('LIST', 'INT')
    RETURN_NAMES = ('list', 'count')
    OUTPUT_TOOLTIPS = (
        'list',
        TOOLTIP_OUTPUT_COUNT,
    )
    DESCRIPTION = 'Create a list from any number of individual elements.'

    def run(self, **kw):
        output = []
        for elt in kw.values():
            output.append(elt)

        return (output, len(output))


@register_node('List: Merge', 'list')
class ListMerge:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {'required': {}}

    FUNCTION = 'run'
    RETURN_TYPES = ('LIST', 'INT')
    RETURN_NAMES = ('list', 'count')
    OUTPUT_TOOLTIPS = (
        'merged list',
        TOOLTIP_OUTPUT_COUNT,
    )
    DESCRIPTION = 'Merge any number of lists into one.'

    def run(self, **kw):
        output = []
        for l in kw.values():
            output += l

        return (output, len(output))


@register_node('List: Limit', 'list')
class ListLimit:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'list': ('LIST', {'tooltip': 'list to extract from'}),
                'nb_elements': (
                    'INT',
                    {'default': 1, 'min': 1, 'tooltip': 'number of elements'},
                ),
                'method': (
                    ['first', 'last'],
                    {
                        'default': 'first',
                        'tooltip': 'how to extract',
                    },
                ),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('LIST', 'INT')
    RETURN_NAMES = ('list', 'count')
    OUTPUT_TOOLTIPS = (
        'limited list',
        TOOLTIP_OUTPUT_COUNT,
    )
    DESCRIPTION = 'Limit list to a given size.'

    def run(self, list, nb_elements: int, method: str):
        output = []
        match method:
            case 'first':
                output = list[:nb_elements]
            case 'last':
                output = list[-nb_elements:]

        return (output, len(output))


@register_node('List: Random Seeds', 'list')
class ListRandomSeeds:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'count': (
                    'INT',
                    {'default': 1, 'min': 1, 'tooltip': 'number of random seeds'},
                ),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('LIST', 'INT')
    RETURN_NAMES = ('list', 'count')
    OUTPUT_TOOLTIPS = (
        'list of random seeds',
        TOOLTIP_OUTPUT_COUNT,
    )
    DESCRIPTION = 'Return a list of random seeds.'

    # ensure the list is regenerated
    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float('NaN')

    def run(self, count):
        values = []
        for i in range(0, count):
            values.append(math.floor(random.randrange(0, 0xFFFFFFFFFFFFFFFF)))
        return (values, len(values))


@register_node('List: Checkpoints', 'list')
class ListCheckpoints:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'selection': (
                    'SELECTION_LIST',
                    {'all': folder_paths.get_filename_list('checkpoints')},
                ),
                'with_extension': (
                    'BOOLEAN',
                    {'default': True, 'tooltip': 'keep file extension?'},
                ),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('LIST', 'INT')
    RETURN_NAMES = ('list', 'count')
    OUTPUT_TOOLTIPS = (
        'list of checkpoint file names',
        TOOLTIP_OUTPUT_COUNT,
    )
    DESCRIPTION = 'Create a list of selected checkpoint file names.'

    def run(self, with_extension, selection, **kwargs):
        output = []
        for file in selection['selected']:
            if not with_extension:
                output.append(str(Path(file).stem))
            else:
                output.append(file)
        return (output, len(output))


@register_node('List: LoRAs', 'list')
class ListLoras:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'selection': (
                    'SELECTION_LIST',
                    {'all': folder_paths.get_filename_list('loras')},
                ),
                'with_extension': (
                    'BOOLEAN',
                    {'default': True, 'tooltip': 'keep file extension?'},
                ),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('LIST', 'INT')
    RETURN_NAMES = ('list', 'count')
    OUTPUT_TOOLTIPS = (
        'list of LoRA file names',
        TOOLTIP_OUTPUT_COUNT,
    )
    DESCRIPTION = 'Create a list of selected LoRA file names.'

    def run(self, with_extension, selection, **kwargs):
        output = []
        for file in selection['selected']:
            if not with_extension:
                output.append(str(Path(file).stem))
            else:
                output.append(file)
        return (output, len(output))


@register_node('List: Samplers', 'list')
class ListSamplers:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'selection': (
                    'SELECTION_LIST',
                    {'all': KSampler.SAMPLERS},
                ),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('LIST', 'INT')
    RETURN_NAMES = ('list', 'count')
    OUTPUT_TOOLTIPS = (
        'list of sampler names',
        TOOLTIP_OUTPUT_COUNT,
    )
    DESCRIPTION = 'Create a list of selected sampler names.'

    def run(self, selection, **kwargs):
        output = selection['selected']
        return (output, len(output))


@register_node('List: Schedulers', 'list')
class ListSchedulers:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'selection': (
                    'SELECTION_LIST',
                    {'all': KSampler.SCHEDULERS},
                ),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('LIST', 'INT')
    RETURN_NAMES = ('list', 'count')
    OUTPUT_TOOLTIPS = (
        'list of scheduler names',
        TOOLTIP_OUTPUT_COUNT,
    )
    DESCRIPTION = 'Create a list of selected scheduler names.'

    def run(self, selection, **kwargs):
        output = selection['selected']
        return (output, len(output))
