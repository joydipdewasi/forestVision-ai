"""Geospatial scaling, area calculations, and calibration telemetry."""

from typing import Dict, Any, Optional, Tuple
from app.schemas.analysis_schema import GeospatialMetadata


def compute_geospatial_metrics(
    total_canopy_pixels: int,
    total_image_pixels: int,
    image_width: int,
    image_height: int,
    effective_gsd: Optional[float],
    metadata: Dict[str, Any]
) -> Tuple[Dict[str, Any], GeospatialMetadata]:
    """
    Computes deterministic area and coverage measurements based on available spatial calibration.
    """
    if effective_gsd is not None and effective_gsd > 0:
        # Real-world metric scaling in square meters (m²)
        pixel_area_m2 = effective_gsd ** 2
        canopy_area = round(float(total_canopy_pixels * pixel_area_m2), 2)
        analyzed_area = round(float(total_image_pixels * pixel_area_m2), 2)
        non_canopy_area = round(float(analyzed_area - canopy_area), 2)
        
        # Canopy coverage percentage (deterministic)
        canopy_coverage = round(float((canopy_area / analyzed_area) * 100.0), 2) if analyzed_area > 0 else 0.0

        # Hectares
        analyzed_ha = analyzed_area / 10000.0

        source_name = "GeoTIFF Metadata (Embedded)" if metadata.get("is_geotiff") and metadata.get("gsd") == effective_gsd else "Calibrated Sensor GSD"
        
        geospatial_meta = GeospatialMetadata(
            has_spatial_scale=True,
            source=source_name,
            gsd=round(float(effective_gsd), 4),
            unit="m²",
            unit_length="m",
            crs=metadata.get("crs"),
            disclaimer=f"Calibrated at {effective_gsd}m GSD. 1 pixel = {round(pixel_area_m2, 4)} m²."
        )

        metrics = {
            "canopy_area": canopy_area,
            "analyzed_area": analyzed_area,
            "non_canopy_area": non_canopy_area,
            "canopy_coverage": canopy_coverage,
            "unit": "m²",
            "unit_length": "m",
            "analyzed_ha": round(analyzed_ha, 3),
        }
    else:
        # Uncalibrated image-space pixels
        canopy_area = float(total_canopy_pixels)
        analyzed_area = float(total_image_pixels)
        non_canopy_area = float(analyzed_area - canopy_area)
        canopy_coverage = round(float((canopy_area / analyzed_area) * 100.0), 2) if analyzed_area > 0 else 0.0

        geospatial_meta = GeospatialMetadata(
            has_spatial_scale=False,
            source="Uncalibrated Image-Space",
            gsd=None,
            unit="px²",
            unit_length="px",
            crs=None,
            disclaimer="No embedded geographic scale detected. Calculations are reported in image-space pixels. To compute real-world m², specify the sensor Ground Sampling Distance (GSD)."
        )

        metrics = {
            "canopy_area": canopy_area,
            "analyzed_area": analyzed_area,
            "non_canopy_area": non_canopy_area,
            "canopy_coverage": canopy_coverage,
            "unit": "px²",
            "unit_length": "px",
            "analyzed_ha": None,
        }

    return metrics, geospatial_meta
