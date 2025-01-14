CATEGORY = 'ComfyLab'
CATSHORT = 'lab'
ALL_NODES = {}


def register_node(display_name: str, subcat: str = ''):
    def decorator(cls):
        ALL_NODES[cls] = '{} ({})'.format(display_name, CATSHORT)
        cls.CATEGORY = '{}/{}'.format(CATEGORY, subcat) if subcat else CATEGORY
        return cls

    return decorator
