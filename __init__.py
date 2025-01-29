from pathlib import Path

from .src.python.collection.collect_nodes import (
    import_all,
    make_class_mappings,
    make_display_name_mappings,
    make_node_list,
)
from .src.python.collection.register_nodes import CATEGORY
from .src.python.shared.api import load_api

import_all()

NODE_CLASS_MAPPINGS = make_class_mappings()
NODE_DISPLAY_NAME_MAPPINGS = make_display_name_mappings()
make_node_list(Path(__file__).parent / 'node_list.json')

load_api()

print(
    ' ⚙️  {}: {} carefully crafted nodes available'.format(
        CATEGORY, len(NODE_CLASS_MAPPINGS)
    )
)


WEB_DIRECTORY = './dist/js'
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY']
