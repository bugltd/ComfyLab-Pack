from ..collection.register_nodes import register_node
from ..shared.utils import AnyReturnTypes, EmptyNode


@register_node('Node Config: Fetch', 'experimental')
class NodeConfigFetch(EmptyNode):
    DESCRIPTION = 'Generate the JSON or YAML config for a node.'


@register_node('Node Config: Apply (local)', 'experimental')
class NodeConfigApplyLocal(EmptyNode):
    DESCRIPTION = 'Apply a JSON or YAML config to a node.'


@register_node('Multi Config: Fetch', 'experimental')
class MultiConfigFetch(EmptyNode):
    DESCRIPTION = 'Generate the JSON or YAML config for all nodes in workflow.\nWhen identifying nodes by title or name, duplicates will be discarded to avoid ambiguity.'


@register_node('Multi Config: Apply (local)', 'experimental')
class MultiConfigApplyLocal(EmptyNode):
    DESCRIPTION = 'Apply a JSON or YAML config to multiple nodes.'


@register_node('Output Config: Auto (aka The Octopus)', 'experimental')
class OutputConfigAuto:
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

    DESCRIPTION = 'Load a local JSON or YAML config file, generate outputs and optionally auto-connect them.'

    def run(self, data):
        values = [entry['value'] for entry in data.values()]
        return (*values,)
