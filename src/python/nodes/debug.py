from ..collection.register_nodes import register_node


@register_node('Debug: Widget Types', 'debug')
class DebugWidgetTypes:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'a_boolean': (
                    'BOOLEAN',
                    {'default': True},
                ),
                'a_combo': (
                    ['value1', 'value2'],
                    {'default': 'value2'},
                ),
                'a_string': (
                    'STRING',
                    {'default': 'default text', 'multiline': False},
                ),
                'a_multiline': (
                    'STRING',
                    {'default': 'default multline text', 'multiline': True},
                ),
                'a_int': (
                    'INT',
                    {'default': 65},
                ),
                'a_float': (
                    'FLOAT',
                    {'default': 65.76},
                ),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = ()
    RETURN_NAMES = ()
    DESCRIPTION = 'Debug node to test various widget types.'

    def run(self):
        return ()


@register_node('Debug: JSON / YAML parse', 'debug')
class DebugJSONYAML:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {'required': {}}

    FUNCTION = 'run'
    RETURN_TYPES = ()
    RETURN_NAMES = ()
    DESCRIPTION = 'Debug node to test JSON / YAML parse.'

    def run(self):
        return ()


@register_node('Debug: Widget Visibility', 'debug')
class DebugWidgetVisibility:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {'required': {}}

    FUNCTION = 'run'
    RETURN_TYPES = ()
    RETURN_NAMES = ()
    DESCRIPTION = 'Debug node to widget visibility.'

    def run(self):
        return ()
