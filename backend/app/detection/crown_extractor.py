"""Individual tree crown peak detection, marker-controlled watershed segmentation, and polygon extraction."""

import math
from typing import List, Dict, Any, Tuple
import numpy as np
import cv2
from scipy.ndimage import maximum_filter, label


def detect_treetop_apexes(
    rgb_image: np.ndarray,
    canopy_mask: np.ndarray,
    min_distance_px: int = 7,
    threshold_rel: float = 0.15
) -> np.ndarray:
    """
    Detects local radiometric apexes (treetops) within the canopy mask.
    Combines grayscale luminance and ExG spectral intensity.
    """
    gray = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY).astype(np.float32)
    
    # Excess green intensity
    r = rgb_image[:, :, 0].astype(np.float32)
    g = rgb_image[:, :, 1].astype(np.float32)
    b = rgb_image[:, :, 2].astype(np.float32)
    exg = 2.0 * g - r - b
    exg_norm = cv2.normalize(exg, None, 0, 255, cv2.NORM_MINMAX)

    # Combined apex response
    response = 0.4 * gray + 0.6 * exg_norm
    
    # Smooth with Gaussian filter to reduce leaf-level sub-pixel noise
    blurred = cv2.GaussianBlur(response, (5, 5), sigmaX=1.5)

    # Local maximum filter
    footprint_size = max(5, min_distance_px)
    local_max = maximum_filter(blurred, size=footprint_size) == blurred

    # Exclude background / non-canopy pixels
    canopy_bool = canopy_mask > 0
    valid_peaks = local_max & canopy_bool

    # Threshold: peak must be above local baseline
    min_val = np.percentile(blurred[canopy_bool], 15) if np.any(canopy_bool) else 0
    valid_peaks = valid_peaks & (blurred >= min_val + 5)

    return valid_peaks


def segment_crowns_watershed(
    rgb_image: np.ndarray,
    canopy_mask: np.ndarray,
    treetop_peaks: np.ndarray
) -> Tuple[np.ndarray, int]:
    """
    Performs marker-controlled watershed segmentation to partition the canopy into individual crowns.
    Returns:
        (watershed_labels, num_crowns)
    """
    h, w = canopy_mask.shape

    # 1. Connected components on peaks to get distinct seed markers
    peak_labels, num_peaks = label(treetop_peaks)
    
    if num_peaks == 0:
        # Fallback: if no peaks found (e.g. extremely uniform/small patch), use connected components on canopy mask
        num_labels, comp_labels = cv2.connectedComponents(canopy_mask)
        return comp_labels, max(0, num_labels - 1)

    # 2. Setup markers for cv2.watershed
    # 0 = unknown, 1 = background/open terrain, 2..N+1 = individual tree crowns
    markers = np.zeros((h, w), dtype=np.int32)
    
    # Background marker (sure background: inverted canopy mask dilated slightly)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    sure_bg = cv2.dilate((canopy_mask == 0).astype(np.uint8), kernel, iterations=1)
    markers[sure_bg > 0] = 1

    # Foreground markers (each treetop gets unique ID starting at 2)
    markers[peak_labels > 0] = peak_labels[peak_labels > 0] + 1

    # 3. Watershed on RGB image gradient
    bgr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
    # Apply watershed
    cv2.watershed(bgr, markers)

    # 4. Clean labels: watershed sets boundaries to -1 and background to 1
    # Only keep markers > 1 that are inside canopy_mask
    crown_labels = np.zeros((h, w), dtype=np.int32)
    canopy_valid = (canopy_mask > 0) & (markers > 1)
    crown_labels[canopy_valid] = markers[canopy_valid]

    return crown_labels, num_peaks


def extract_crown_polygons_and_metrics(
    crown_labels: np.ndarray,
    canopy_mask: np.ndarray,
    rgb_image: np.ndarray,
    gsd: float = None,
    min_crown_area_px: int = 6
) -> List[Dict[str, Any]]:
    """
    Extracts geometric properties, simplified contour polygons, centroids, and classification for each crown.
    """
    unique_labels = np.unique(crown_labels)
    unique_labels = unique_labels[unique_labels > 1] # Skip 0 (bg) and 1 (non-forest)

    hsv = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2HSV)
    saturation = hsv[:, :, 1]
    value = hsv[:, :, 2]

    crown_results = []
    tree_idx = 1

    for lbl in unique_labels:
        mask_i = (crown_labels == lbl).astype(np.uint8) * 255
        pixel_count = int(np.count_nonzero(mask_i))
        
        if pixel_count < min_crown_area_px:
            continue

        # Extract contour
        contours, _ = cv2.findContours(mask_i, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            continue

        # Take the largest contour for this segment
        main_contour = max(contours, key=cv2.contourArea)
        c_area = float(cv2.contourArea(main_contour))
        if c_area < min_crown_area_px * 0.8:
            c_area = float(pixel_count)

        # Centroid
        m = cv2.moments(main_contour)
        if m["m00"] != 0:
            cx = float(m["m10"] / m["m00"])
            cy = float(m["m01"] / m["m00"])
        else:
            # Fallback to mean coordinates
            ys, xs = np.where(mask_i > 0)
            cx = float(np.mean(xs))
            cy = float(np.mean(ys))

        # Equivalent radius & diameter in pixels
        radius_px = float(math.sqrt(c_area / math.pi))
        
        # Physical scaling
        if gsd and gsd > 0:
            area_real = float(c_area * (gsd ** 2))
            radius_real = float(radius_px * gsd)
            diam_real = radius_real * 2.0
        else:
            area_real = c_area
            radius_real = None
            diam_real = radius_px * 2.0

        # Polygon simplification (Douglas-Peucker) for fast responsive client vector rendering
        epsilon = max(1.0, 0.02 * cv2.arcLength(main_contour, True))
        approx_poly = cv2.approxPolyDP(main_contour, epsilon, True)
        
        poly_points = []
        for pt in approx_poly:
            poly_points.append([round(float(pt[0][0]), 1), round(float(pt[0][1]), 1)])
        
        # Ensure polygon closes
        if len(poly_points) > 2 and poly_points[0] != poly_points[-1]:
            poly_points.append(poly_points[0])

        # Confidence and Health assessment based on green spectral saturation & local circularity
        mean_sat = float(np.mean(saturation[mask_i > 0])) if np.any(mask_i > 0) else 128.0
        mean_val = float(np.mean(value[mask_i > 0])) if np.any(mask_i > 0) else 128.0
        
        perimeter = float(cv2.arcLength(main_contour, True))
        circularity = 4.0 * math.pi * c_area / (perimeter ** 2 + 1e-5) if perimeter > 0 else 0.5
        circularity = min(1.0, max(0.2, circularity))

        # Combined confidence score (0.75 to 0.99)
        conf = 0.70 + 0.15 * (mean_sat / 255.0) + 0.15 * circularity
        conf = round(min(0.99, max(0.65, conf)), 3)

        # Flag uncertain / shadowed detections
        is_uncertain = bool(mean_val < 35 or mean_sat < 30 or circularity < 0.25)

        # Crown category classification based on physical or pixel diameter
        effective_diam = diam_real if (gsd and gsd > 0) else (diam_real * 0.1) # normalized
        if effective_diam >= 6.0 or radius_px >= 20:
            category = "Dominant / Mature Crown"
        elif effective_diam >= 3.0 or radius_px >= 10:
            category = "Co-Dominant Canopy"
        else:
            category = "Intermediate / Understory"

        crown_id = f"FV-{tree_idx:04d}"
        tree_idx += 1

        crown_results.append({
            "id": crown_id,
            "center_x": round(cx, 1),
            "center_y": round(cy, 1),
            "radius_px": round(radius_px, 2),
            "radius_m": round(radius_real, 2) if radius_real is not None else None,
            "area": round(area_real, 2),
            "area_px": round(c_area, 1),
            "confidence": conf,
            "category": category,
            "polygon": poly_points,
            "is_uncertain": is_uncertain
        })

    return crown_results
