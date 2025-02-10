import torch
from torchvision.transforms import v2 as transforms
import cv2
from webcolors import hex_to_rgb

from ..collection.register_nodes import register_node
from ..shared.utils import tensor_to_cv, cv_to_tensor

ALL_METHODS = {
    # 'ccoeff': cv2.TM_CCOEFF,
    'ccoeff_normed': cv2.TM_CCOEFF_NORMED,
    # 'ccorr': cv2.TM_CCORR,
    'ccorr_normed': cv2.TM_CCORR_NORMED,
    # 'sqdiff': cv2.TM_SQDIFF,
    'sqdiff_normed': cv2.TM_SQDIFF_NORMED,
}


@register_node('Match Template (OpenCV)', 'experimental')
class MatchTemplate:
    """Search for a template inside an image, using OpenCV Template matching method.

    - method: detection method, either 'ccoeff_normed', 'ccorr_normed' or 'sqdiff_normed'.
        - Recommended: 'ccoeff_normed'
    """

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            'required': {
                'image': ('IMAGE',),
                'template': ('IMAGE',),
                'method': (
                    list(ALL_METHODS.keys()),
                    {
                        'default': 'ccoeff_normed',
                        'tooltip': 'detection algorithm, default is ccoeff_normed',
                    },
                ),
                'threshold': (
                    'FLOAT',
                    {'min': 0, 'max': 1, 'default': 0.5, 'step': 0.01},
                ),
                'template_fill_hex': (
                    'STRING',
                    {
                        'default': '#999',
                        'tooltip': 'background color to apply to template',
                    },
                ),
            }
        }

    FUNCTION = 'run'
    RETURN_TYPES = ('MASK', 'FLOAT', 'STRING', 'IMAGE', 'MASK', 'IMAGE')
    RETURN_NAMES = (
        'mask',
        'confidence',
        'detected_box',
        'debug_detection',
        'debug_template_mask',
        'debug_template_image',
    )
    OUTPUT_TOOLTIPS = (
        'mask',
        'confidence level',
        'detected box (x, y, w, h)',
        'detection image',
        'detection - template (mask)',
        'detection - template (image)',
    )

    DESCRIPTION = (
        'Search for a template inside an image, using OpenCV Template matching method.'
    )

    def run(
        self,
        image: torch.Tensor,
        template: torch.Tensor,
        method,
        threshold: float,
        template_fill_hex: str,
    ) -> torch.Tensor:
        img_cv = tensor_to_cv(image)
        tpl_cv = tensor_to_cv(template)
        # tpl_cv = cv2.imread(
        #     '/mnt/nvm/enc/sd/comfyui/tests/20241029 - test logo/create mask/2 - logo_cleaned - cropped - transparent.png', cv2.IMREAD_UNCHANGED)
        meth = ALL_METHODS[method]

        # fill the template with color
        tpl_cv_mask = tpl_cv[:, :, 3] == 0
        tpl_cv = tpl_cv.copy()
        (r, g, b) = hex_to_rgb(template_fill_hex)
        tpl_cv[tpl_cv_mask] = [r, g, b, 255]
        tpl_cv = cv2.cvtColor(tpl_cv, cv2.COLOR_BGRA2BGR)

        # detect template
        result = cv2.matchTemplate(img_cv, tpl_cv, meth)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

        # if the method is TM_SQDIFF or TM_SQDIFF_NORMED, take minimum
        if meth in [cv2.TM_SQDIFF, cv2.TM_SQDIFF_NORMED]:
            (x, y) = min_loc
        else:
            (x, y) = max_loc

        # if value is less than threshold, exit now
        # if (max_val < threshold):
        #     return (image, max_val, None, None, None, None)

        # draw the rectangle
        # w, h = tpl_cv.shape[::-1] # or 2?
        w = tpl_cv.shape[1]
        h = tpl_cv.shape[0]

        cv2.rectangle(img_cv, (x, y), (x + w, y + h), (255, 0, 0), (w + h) // 100 + 1)

        # create mask from template
        template_sum = template.sum(axis=3)
        tpl_mask = torch.where(template_sum > 0, 1.0, 0.0)
        tpl_mask = 1.0 - tpl_mask

        # pad the mask
        img_w = img_cv.shape[1]
        img_h = img_cv.shape[0]
        mask = transforms.functional.pad(
            tpl_mask,
            padding=(x, y, img_w - x - w, img_h - y - h),
            fill=1,
            padding_mode='constant',
        )

        # format box coordinates
        box_coords = '{0}, {1}, {2}, {3}'.format(x, y, w, h)

        return (
            mask,
            max_val,
            box_coords,
            cv_to_tensor(img_cv),
            tpl_mask,
            cv_to_tensor(tpl_cv),
        )
