import os
import re
from typing import List, Dict


def prepare_image_list(config) -> List[str]:
    image_paths = config.get_image_paths()
    
    custom_preloading = config.config.get('custom_preloading', {})
    if not custom_preloading.get('customEntry'):
        return list(image_paths.keys())
    
    custom_entry = custom_preloading['customEntry'].split(',')
    selected_option = custom_preloading.get('selectedOption')
    
    all_images = list(image_paths.keys())
    
    if selected_option == 'selectOnly':
        return _select_only(all_images, custom_entry)
    elif selected_option == 'excludeOnly':
        return _exclude_only(all_images, custom_entry)
    
    return all_images


def _select_only(images: List[str], values: List[str]) -> List[str]:
    allowed_images = set()
    for value in values:
        allowed_images.update([i for i in images if i.startswith(value.strip())])
    return list(allowed_images)


def _exclude_only(images: List[str], values: List[str]) -> List[str]:
    excluded_images = set()
    for value in values:
        excluded_images.update([i for i in images if i.startswith(value.strip())])
    return [img for img in images if img not in excluded_images]
