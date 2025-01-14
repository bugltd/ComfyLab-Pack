from ..collection.register_nodes import register_node
from ..shared.utils import AnyReturnTypes


@register_node('Output Config: Load', 'config')
class OutputConfigLocal:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'data': ('HIDDEN', {}),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = AnyReturnTypes()

    DESCRIPTION = (
        'Load a local JSON or YAML config file, and dynamically generate outputs.'
    )

    def run(self, data):
        values = [entry['value'] for entry in data.values()]
        return (*values,)


@register_node('Output Config: Retrieve (backend)', 'config')
class OutputConfigBackend:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'data': ('HIDDEN', {}),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = AnyReturnTypes()

    DESCRIPTION = 'Retrieve a JSON or YAML config file from backend, and dynamically generate outputs.'

    def run(self, data):
        values = [entry['value'] for entry in data.values()]
        return (*values,)
