import torch  # type: ignore
from PIL import Image
import numpy as np


class AnyType(str):
    def __ne__(self, __value: object) -> bool:
        return False


ANY_TYPE = AnyType('*')


class AnyReturnTypes(tuple):
    def __getitem__(self, key):
        return ANY_TYPE


def tensor_to_pillow(tensor: torch.Tensor) -> Image.Image:
    return Image.fromarray(
        np.clip(255.0 * tensor.cpu().numpy().squeeze(), 0, 255).astype(np.uint8)
    )


def pillow_to_tensor(image: Image.Image) -> torch.Tensor:
    return torch.from_numpy(np.array(image).astype(np.float32) / 255.0).unsqueeze(0)


def tensor_to_cv(tensor: torch.Tensor):
    # return np.clip(255 * tensor.cpu().numpy().squeeze(), 0, 255).astype(np.uint8)
    return (tensor.numpy().squeeze(0) * 255).astype(np.uint8)  # <- works


def cv_to_tensor(image) -> torch.Tensor:
    return torch.from_numpy(image.astype(np.float32) / 255.0).unsqueeze(0)


class EmptyNode:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {},
            'optional': {},
        }

    FUNCTION = 'run'
    RETURN_TYPES = ()

    DESCRIPTION = 'This is an empty node. Not useless though.'

    def run(self):
        pass
