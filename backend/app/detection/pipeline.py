"""Master Computer Vision pipeline orchestrator for tree crown detection and canopy estimation."""

import time
from typing import Dict, Any, Optional
import numpy as np

from app.detection.vegetation import extract_vegetation_canopy_mask
from app.detection.crown_extractor import (
    detect_treetop_apexes,
    segment_crowns_watershed,
    extract_crown_polygons_and_metrics,
)


def run_tree_crown_detection_pipeline(
    rgb_image: np.ndarray,
    metadata: Dict[str, Any],
    custom_gsd: Optional[float] = None
) -> Dict[str, Any]:
    """
    Executes the deterministic 4-stage CV pipeline:
    1. Preprocessing & scaling verification
    2. Multispectral canopy vegetation extraction
    3. Radiometric apex detection & Watershed segmentation
    4. Crown geometry & polygon extraction
    """
    total_start = time.perf_counter()
    stage_timings: Dict[str, float] = {}

    h, w = rgb_image.shape[:2]
    
    # Scale resolution: priority to user-specified GSD, then GeoTIFF metadata GSD
    effective_gsd = custom_gsd if custom_gsd is not None and custom_gsd > 0 else metadata.get("gsd")

    # Adapt minimum distance between peaks based on resolution and image size
    # If GSD is known, 1.5m to 2.5m minimum crown spacing
    if effective_gsd and effective_gsd > 0:
        min_peak_dist = max(4, int(round(1.8 / effective_gsd)))
    else:
        # Scale adaptively with image diagonal
        diagonal = np.sqrt(w**2 + h**2)
        min_peak_dist = max(5, int(diagonal / 150))

    # --- Stage 1: Preparation ---
    t0 = time.perf_counter()
    # Image is already in RGB uint8 format
    stage_timings["preparing_image"] = round(time.perf_counter() - t0, 3)

    # --- Stage 2: Vegetation Extraction ---
    t0 = time.perf_counter()
    canopy_mask = extract_vegetation_canopy_mask(rgb_image)
    stage_timings["detecting_vegetation"] = round(time.perf_counter() - t0, 3)

    # --- Stage 3: Crown Detection & Watershed Segmentation ---
    t0 = time.perf_counter()
    peaks = detect_treetop_apexes(rgb_image, canopy_mask, min_distance_px=min_peak_dist)
    crown_labels, num_peaks = segment_crowns_watershed(rgb_image, canopy_mask, peaks)
    stage_timings["segmenting_crowns"] = round(time.perf_counter() - t0, 3)

    # --- Stage 4: Measuring Canopy & Extracting Polygons ---
    t0 = time.perf_counter()
    crowns = extract_crown_polygons_and_metrics(
        crown_labels=crown_labels,
        canopy_mask=canopy_mask,
        rgb_image=rgb_image,
        gsd=effective_gsd,
        min_crown_area_px=max(6, int(min_peak_dist * 1.5))
    )
    stage_timings["measuring_canopy"] = round(time.perf_counter() - t0, 3)

    total_duration = round(time.perf_counter() - total_start, 3)

    # Total canopy pixels directly from the mask
    total_canopy_pixels = int(np.count_nonzero(canopy_mask))
    total_image_pixels = int(w * h)

    return {
        "crowns": crowns,
        "canopy_mask": canopy_mask,
        "crown_labels": crown_labels,
        "total_canopy_pixels": total_canopy_pixels,
        "total_image_pixels": total_image_pixels,
        "image_width": w,
        "image_height": h,
        "effective_gsd": effective_gsd,
        "stage_timings": stage_timings,
        "inference_time_seconds": total_duration,
    }
