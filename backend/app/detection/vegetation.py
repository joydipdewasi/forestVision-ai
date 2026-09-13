"""Vegetation index computation and photosynthetic canopy extraction."""

import numpy as np
import cv2


def extract_vegetation_canopy_mask(rgb_image: np.ndarray) -> np.ndarray:
    """
    Extracts a robust binary canopy vegetation mask using multispectral/colorimetric indices:
    - Excess Green Index (ExG = 2*G - R - B)
    - Normalized Difference Green-Red Index (GLI / NGRDI = (2G - R - B)/(2G + R + B))
    - HSV chromatic green-forest filtering
    
    Returns:
        binary uint8 mask of shape (H, W) where 255 = canopy, 0 = non-canopy.
    """
    img_float = rgb_image.astype(np.float32)
    r = img_float[:, :, 0]
    g = img_float[:, :, 1]
    b = img_float[:, :, 2]

    # 1. Excess Green Index (ExG)
    exg = 2.0 * g - r - b

    # 2. Normalized Green Leaf Index (GLI)
    denom = 2.0 * g + r + b + 1e-6
    gli = (2.0 * g - r - b) / denom

    # 3. HSV Color Space Filtering for Natural Evergreen and Deciduous Foliage
    hsv = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2HSV)
    h = hsv[:, :, 0]
    s = hsv[:, :, 1]
    v = hsv[:, :, 2]

    # Typical green-to-olive forest spectrum: Hue between 25 (yellow-green) and 90 (emerald green)
    # Exclude very dark shadows (V < 15) and washed-out pure gray/white clouds (S < 15, V > 230)
    hsv_green_mask = (h >= 24) & (h <= 96) & (s >= 20) & (v >= 18)

    # 4. Otsu Adaptive Thresholding on Normalized ExG
    # Normalize ExG to 0..255
    exg_norm = cv2.normalize(exg, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    _, exg_otsu = cv2.threshold(exg_norm, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # 5. Combine indices: pixel is canopy if ExG Otsu agrees OR (GLI is positive AND HSV green holds)
    combined_mask = np.zeros(rgb_image.shape[:2], dtype=np.uint8)
    is_canopy = (exg_otsu > 0) & (gli > -0.05) & (v > 15) & ((hsv_green_mask) | (exg > 5))
    combined_mask[is_canopy] = 255

    # 6. Morphological cleanup: Remove speckle noise, fill small holes inside dense crowns
    kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    kernel_medium = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    
    # Opening (removes tiny isolated non-forest noise)
    cleaned = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel_small)
    # Closing (bridges tiny gaps inside solid crown leaves)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel_medium)

    return cleaned
