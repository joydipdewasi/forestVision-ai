"""Telemetry and vector export utilities for CSV, GeoJSON, and JSON summary packages."""

import io
import csv
import json
from typing import List, Dict, Any, Optional
from app.schemas.analysis_schema import CrownDetection


def generate_crowns_csv(crowns: List[CrownDetection], filename: str = "forest_crowns_telemetry.csv") -> str:
    """Generates a CSV string containing tree-by-tree detection data."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "tree_id",
        "center_x_px",
        "center_y_px",
        "radius_px",
        "radius_m",
        "area",
        "area_px",
        "confidence",
        "category",
        "is_uncertain"
    ])

    for c in crowns:
        writer.writerow([
            c.id,
            c.center_x,
            c.center_y,
            c.radius_px,
            c.radius_m if c.radius_m is not None else "",
            c.area,
            c.area_px,
            c.confidence,
            c.category,
            "true" if c.is_uncertain else "false"
        ])

    return output.getvalue()


def generate_crowns_geojson(
    crowns: List[CrownDetection],
    image_width: int,
    image_height: int,
    gsd: Optional[float] = None
) -> str:
    """Generates GeoJSON FeatureCollection for detected crown polygons."""
    features = []
    
    for c in crowns:
        feature = {
            "type": "Feature",
            "properties": {
                "id": c.id,
                "area": c.area,
                "radius_px": c.radius_px,
                "radius_m": c.radius_m,
                "confidence": c.confidence,
                "category": c.category,
                "is_uncertain": c.is_uncertain,
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [c.polygon] if c.polygon else []
            }
        }
        features.append(feature)

    geojson_obj = {
        "type": "FeatureCollection",
        "metadata": {
            "platform": "ForestVision AI Canopy Intelligence",
            "image_width": image_width,
            "image_height": image_height,
            "gsd": gsd,
            "total_features": len(features)
        },
        "features": features
    }

    return json.dumps(geojson_obj, indent=2)
