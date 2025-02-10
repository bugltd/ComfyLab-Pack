import importlib
import os
from dotenv import load_dotenv  # type: ignore
import json

from .register_nodes import ALL_NODES


def import_all(load_env=True):
    DEBUG = False

    if load_env:
        load_dotenv()
        DEBUG = bool(os.getenv('DEBUG'))
        MAD_SCIENTIST = bool(os.getenv('MAD_SCIENTIST'))

    MODULES = ['plot', 'list', 'config', 'queue', 'input', 'utils']
    if DEBUG:
        MODULES.append('debug')
    if MAD_SCIENTIST:
        MODULES.append('experimental')

    for mod in MODULES:
        importlib.import_module('...nodes.' + mod, package=__name__)


def make_class_mappings():
    return {cls.__name__: cls for cls in ALL_NODES.keys()}


def make_display_name_mappings():
    return {cls.__name__: display_name for cls, display_name in ALL_NODES.items()}


def make_node_list(path: str):
    # node_list = {
    #     display_name: cls.DESCRIPTION for cls, display_name in ALL_NODES.items()
    # }
    node_list = {}
    for cls, display_name in ALL_NODES.items():
        subcat = cls.CATEGORY.split('/')[-1].lower()
        if subcat in ['debug', 'experimental']:
            continue
        descp = cls.DESCRIPTION.split('\n')[0]
        # descp = cls.DESCRIPTION
        if descp[-1] == '.':
            descp = descp[:-1]
        node_list[display_name] = descp
    with open(path, 'w') as f:
        f.write(json.dumps(node_list, indent=2))
