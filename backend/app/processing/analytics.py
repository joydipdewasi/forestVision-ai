"""Forest structural analytics, crown size distributions, and summary statistics."""

from typing import List, Dict, Any, Optional
import numpy as np
from app.schemas.analysis_schema import DistributionBin, CrownDetection


def compute_forest_analytics(
    crowns_data: List[Dict[str, Any]],
    analyzed_ha: Optional[float],
    unit: str,
    unit_length: str
) -> Dict[str, Any]:
    """
    Computes summary structural analytics and size distribution histogram from individual crown detections.
    """
    trees_detected = len(crowns_data)
    
    if trees_detected == 0:
        return {
            "trees_detected": 0,
            "density_stems_per_ha": None,
            "mean_crown_diameter": 0.0,
            "mean_crown_area": 0.0,
            "distribution": [],
            "uncertain_detections_count": 0,
            "crown_models": []
        }

    areas = [c["area"] for c in crowns_data]
    mean_area = round(float(np.mean(areas)), 2)

    # Calculate diameters
    diameters = []
    uncertain_count = 0
    crown_models = []

    for c in crowns_data:
        if c.get("is_uncertain"):
            uncertain_count += 1
            
        if unit_length == "m" and c.get("radius_m") is not None:
            diam = c["radius_m"] * 2.0
        else:
            diam = c["radius_px"] * 2.0
        diameters.append(diam)
        
        crown_models.append(CrownDetection(**c))

    mean_diameter = round(float(np.mean(diameters)), 2)

    # Stem density
    density_per_ha = None
    if analyzed_ha is not None and analyzed_ha > 0:
        density_per_ha = round(float(trees_detected / analyzed_ha), 1)

    # Size Distribution Bins (Small, Medium, Large, Mature)
    min_d = float(np.min(diameters))
    max_d = float(np.max(diameters))
    
    # 4 bins
    bins = [
        ("Small / Understory (< 3m)" if unit_length == "m" else "Small (< 15px)", 0.0, 3.0 if unit_length == "m" else 15.0),
        ("Co-Dominant (3 - 5m)" if unit_length == "m" else "Medium (15 - 30px)", 3.0 if unit_length == "m" else 15.0, 5.0 if unit_length == "m" else 30.0),
        ("Dominant (5 - 8m)" if unit_length == "m" else "Large (30 - 50px)", 5.0 if unit_length == "m" else 30.0, 8.0 if unit_length == "m" else 50.0),
        ("Mature Super-Canopy (> 8m)" if unit_length == "m" else "Mature (> 50px)", 8.0 if unit_length == "m" else 50.0, 9999.0),
    ]

    distribution_bins = []
    for label, b_min, b_max in bins:
        count = sum(1 for d in diameters if (d >= b_min and d < b_max))
        pct = round(float((count / trees_detected) * 100.0), 1)
        distribution_bins.append(DistributionBin(
            label=label,
            count=count,
            percentage=pct,
            min_size=b_min,
            max_size=b_max if b_max < 9000 else round(max_d, 1),
            unit=unit_length
        ))

    return {
        "trees_detected": trees_detected,
        "density_stems_per_ha": density_per_ha,
        "mean_crown_diameter": mean_diameter,
        "mean_crown_area": mean_area,
        "distribution": distribution_bins,
        "uncertain_detections_count": uncertain_count,
        "crown_models": crown_models
    }
