import os

from ..collection.register_nodes import register_node


@register_node('Input: Folder', 'input')
class InputFolder:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'path': ('STRING',),
                'check_exists': (
                    'BOOLEAN',
                    {
                        'default': True,
                    },
                ),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('STRING',)
    RETURN_NAMES = ('path',)
    OUTPUT_TOOLTIPS = ('folder path',)
    DESCRIPTION = 'Simple input for a folder, optionally checking it exists'

    def run(self, path: str, check_exists: bool):
        if check_exists and not os.path.isdir(path):
            raise AssertionError("Folder '{0}' does not exist".format(path))

        return (path,)


@register_node('Input: Integer', 'input')
class InputInteger:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {'required': {'value': ('INT', {'default': 0})}}

    FUNCTION = 'run'
    RETURN_TYPES = ('INT',)
    RETURN_NAMES = ('integer',)
    DESCRIPTION = 'Simple node to provide an integer.'

    def run(self, value: int):
        return (value,)


@register_node('Input: Float', 'input')
class InputFloat:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {'required': {'value': ('FLOAT', {'default': 0, 'step': 0.1})}}

    FUNCTION = 'run'
    RETURN_TYPES = ('FLOAT',)
    RETURN_NAMES = ('float',)
    DESCRIPTION = 'Simple node to provide a float.'

    def run(self, value: float):
        return (value,)


@register_node('Input: Boolean', 'input')
class InputBoolean:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {'required': {'value': ('BOOLEAN', {'default': True})}}

    FUNCTION = 'run'
    RETURN_TYPES = ('BOOLEAN',)
    RETURN_NAMES = ('boolean',)
    DESCRIPTION = 'Simple node to provide a boolean.'

    def run(self, value: bool):
        return (value,)


@register_node('Input: String', 'input')
class InputString:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'string': (
                    'STRING',
                    {'default': '', 'multiline': False},
                ),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('STRING',)
    RETURN_NAMES = ('string',)
    DESCRIPTION = 'Simple node to provide a string.'

    def run(self, string: str):
        return (string,)


@register_node('Input: Multiline', 'input')
class InputMultiline:
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
                        'tooltip': "ignore lines starting with '#'",
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
    RETURN_TYPES = ('STRING',)
    RETURN_NAMES = ('multiline',)
    OUTPUT_TOOLTIPS = ('multiline text, with comments optionally stripped',)
    DESCRIPTION = 'Input a multiline string, with comments optionally stripped.'

    def run(
        self,
        load,
        strip_comments: bool,
        multiline: str,
    ):
        lines = multiline.split('\n')
        output = []
        for line in lines:
            line = line.strip()
            if line != '' and (not line.startswith('#') or not strip_comments):
                output.append(line)

        return ('\n'.join(output),)
