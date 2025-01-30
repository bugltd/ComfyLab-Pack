from typing import Any
from pathlib import Path
import glob
from PIL import Image


from ..collection.register_nodes import register_node
from ..shared.utils import ANY_TYPE, pillow_to_tensor


@register_node('Generic Queue', 'queue')
class GenericQueue:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'input_list': (
                    'LIST',
                    {'tooltip': 'list of values, processed by queue'},
                ),
            },
            'optional': {
                'index': ('QUEUE_STATUS', {'tooltip': 'current queue status'}),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = (ANY_TYPE, 'INT', 'INT')
    RETURN_NAMES = ('value', 'index', 'total')
    OUTPUT_TOOLTIPS = ('current value (not typed)', 'current index', 'total elements')
    DESCRIPTION = 'Loop through all values of input list, and send them to output.'

    def run(self, input_list: list[Any], index: int):
        if index < 0:  # value has been reset (completion, interrupt, errors)
            index = 0

        total = len(input_list)
        if total == 0:
            raise Exception('Empty input list')
        return {
            'result': (input_list[index], index + 1, total),
            'ui': {'index': [index], 'total': [total]},
        }


@register_node('File Queue', 'queue')
class FileQueue:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'folder': (
                    'STRING',
                    {'tooltip': 'folder to scan'},
                ),
                'pattern': (
                    'STRING',
                    {
                        'default': '*',
                        'tooltip': "file pattern(s) to match, e.g. '*.txt' or 'prefix*'.\nmultiple patterns can be defined, separated by a comma",
                    },
                ),
                'recursive': (
                    'BOOLEAN',
                    {'default': True, 'tooltip': 'scan recursively?'},
                ),
                'with_extension': (
                    'BOOLEAN',
                    {'default': True, 'tooltip': 'keep or remove file extension'},
                ),
            },
            'optional': {
                'index': ('QUEUE_STATUS', {'tooltip': 'current queue status'}),
            },
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('STRING', 'STRING', 'STRING', 'INT', 'INT')
    RETURN_NAMES = ('filename', 'full_path', 'relative_path', 'index', 'total')
    OUTPUT_TOOLTIPS = (
        'filename',
        'full path',
        'relative path',
        'current index',
        'total files',
    )
    DESCRIPTION = 'Loop through all files in folder matching the pattern(s).'

    # stored scanned files
    root = ''
    files = []
    total = -1

    def scan_folder(
        self, folder: str, pattern: str, recursive: bool
    ) -> tuple[Path, list[Path], int]:
        self.files = []
        self.total = -1

        # do not resolve, to ensure relative path is accurate
        self.root = Path(folder)
        if not self.root.exists():  # follows symlinks
            raise Exception("Path '{}' does not exist".format(self.root))
        if not self.root.is_dir():
            raise Exception("'{}' is not a directory".format(self.root))

        patterns = pattern.split(',')
        self.files = []
        for p in patterns:
            # it = self.root.rglob(p.strip()) if recursive else self.root.glob(p.strip())
            # self.files += [file for file in it if file.is_file()]

            # TODO: go back to Path().glob() with recurse_symlinks=True when Python version is > 3.13
            # in the meantime, we use glob as it follows links by default
            glob_pattern = self.root / '**' / p if recursive else self.root / p
            matches = glob.glob(str(glob_pattern), recursive=recursive)
            for match in matches:
                file = Path(match)
                if file.is_file():
                    self.files.append(file)
        # remove duplicates
        self.files = list(set(self.files))
        # list files in current folder first
        self.files.sort(key=lambda f: [f.parent, f.name])
        self.total = len(self.files)
        if len(self.files) == 0:
            raise Exception('No file found')

    def run(
        self,
        folder: str,
        pattern: str,
        recursive: bool,
        with_extension: bool,
        index: int,
    ):
        if index < 0:  # value has been reset (completion, interrupt, errors)
            index = 0

        # only scan files at the beginning
        if index == 0:
            self.scan_folder(folder, pattern, recursive)

        file = self.files[index]
        return {
            'result': (
                str(file.name) if with_extension else file.stem,
                # do not resolve, to ensure relative path is accurate
                str(file),
                str(file.relative_to(self.root)),
                index + 1,
                self.total,
            ),
            'ui': {'index': [index], 'total': [self.total]},
        }


@register_node('Image Queue', 'queue')
class ImageQueue(FileQueue):
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'folder': (
                    'STRING',
                    {'tooltip': 'folder to scan'},
                ),
                'pattern': (
                    'STRING',
                    {
                        'default': '*.png, *.jpg',
                        'tooltip': "file pattern(s) to match, e.g. '*.jpg' or 'prefix*'.\nmultiple patterns can be defined, separated by a comma",
                    },
                ),
                'recursive': (
                    'BOOLEAN',
                    {'default': True, 'tooltip': 'scan recursively?'},
                ),
                'with_extension': (
                    'BOOLEAN',
                    {'default': True, 'tooltip': 'keep or remove file extension'},
                ),
            },
            'optional': {
                'index': ('QUEUE_STATUS', {'tooltip': 'current queue status'}),
            },
        }

    RETURN_TYPES = ('IMAGE', 'STRING', 'STRING', 'STRING', 'INT', 'INT')
    RETURN_NAMES = ('image', 'filename', 'full_path', 'relative_path', 'index', 'total')
    OUTPUT_TOOLTIPS = (
        'image',
        'filename',
        'full path',
        'relative path',
        'current index',
        'total files',
    )
    DESCRIPTION = 'Loop through all image files in folder matching the pattern(s).'

    def run(
        self,
        folder: str,
        pattern: str,
        recursive: bool,
        with_extension: bool,
        index: int,
    ):
        parent_run = super().run(folder, pattern, recursive, with_extension, index)

        file = parent_run['result'][1]
        img = Image.open(file)

        return {
            'result': (
                pillow_to_tensor(img),
                *parent_run['result'],
            ),
            'ui': {**parent_run['ui']},
        }
