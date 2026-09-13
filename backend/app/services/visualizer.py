"""Result visualization generator: overlays detected crowns, apexes, and AOI boundary on satellite imagery."""

from typing import List, Dict, Any
import numpy as np
import cv2
from app.utils.image_io import image_to_base64_png, mask_to_base64_png


def generate_annotated_result_image(
    rgb_image: np.ndarray,
    crowns_data: List[Dict[str, Any]],
    canopy_mask: np.ndarray
) -> str:
    """
    Renders an aesthetically refined satellite overlay matching the Stitch design:
    - Glowing emerald/mint crown contours (#68dba9 / #34d399)
    - Translucent green canopy fill
    - Treetop apex markers
    - Amber contours for uncertain detections
    - Cyan dashed survey AOI boundary
    """
    h, w = rgb_image.shape[:2]
    
    # Create overlay canvas
    annotated = rgb_image.copy()

    # 1. Subtle green canopy tint over all detected foliage
    overlay_tint = annotated.copy()
    canopy_indices = canopy_mask > 0
    # Add emerald tint (R: 104, G: 219, B: 169)
    overlay_tint[canopy_indices] = (
        overlay_tint[canopy_indices] * 0.75 + np.array([50, 180, 120], dtype=np.float32) * 0.25
    ).astype(np.uint8)
    
    cv2.addWeighted(overlay_tint, 0.6, annotated, 0.4, 0, annotated)

    # 2. Draw Crown Polygons & Outlines
    for crown in crowns_data:
        poly = crown.get("polygon", [])
        if not poly or len(poly) < 3:
            continue
        
        pts = np.array(poly, dtype=np.int32).reshape((-1, 1, 2))
        
        is_uncertain = crown.get("is_uncertain", False)
        if is_uncertain:
            # Amber color (R: 245, G: 158, B: 11)
            stroke_color = (245, 158, 11)
            thickness = 1
        else:
            # Emerald mint (R: 104, G: 219, B: 169)
            stroke_color = (104, 219, 169)
            thickness = 2

        # Draw contour outline
        cv2.polylines(annotated, [pts], isClosed=True, color=stroke_color, thickness=thickness, lineType=cv2.LINE_AA)

        # Draw centroid apex dot
        cx, cy = int(round(crown["center_x"])), int(round(crown["center_y"]))
        if 0 <= cx < w and 0 <= cy < h:
            cv2.circle(annotated, (cx, cy), radius=2, color=(255, 255, 255), thickness=-1, lineType=cv2.LINE_AA)
            if not is_uncertain:
                cv2.circle(annotated, (cx, cy), radius=4, color=(104, 219, 169), thickness=1, lineType=cv2.LINE_AA)

    # 3. Draw Survey AOI Outer Boundary (Cyan / Mint border)
    margin_x = max(10, int(w * 0.02))
    margin_y = max(10, int(h * 0.02))
    aoi_pts = np.array([
        [margin_x, margin_y],
        [w - margin_x, margin_y],
        [w - margin_x, h - margin_y],
        [margin_x, h - margin_y]
    ], dtype=np.int32).reshape((-1, 1, 2))
    
    cv2.polylines(annotated, [aoi_pts], isClosed=True, color=(98, 220, 173), thickness=2, lineType=cv2.LINE_AA)

    return image_to_base64_png(annotated)


def generate_vegetation_mask_image(canopy_mask: np.ndarray) -> str:
    """Returns base64 PNG of pure binary vegetation canopy mask."""
    return mask_to_base64_png(canopy_mask)
