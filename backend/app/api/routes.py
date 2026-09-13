"""FastAPI API routes for ForestVision AI analysis, samples, and telemetry export."""

import os
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response, status
from fastapi.responses import JSONResponse, StreamingResponse
import io

from app.schemas.analysis_schema import AnalysisResponse, SampleDatasetInfo
from app.utils.image_io import read_image_from_bytes
from app.detection.pipeline import run_tree_crown_detection_pipeline
from app.processing.geospatial import compute_geospatial_metrics
from app.processing.analytics import compute_forest_analytics
from app.services.visualizer import generate_annotated_result_image, generate_vegetation_mask_image
from app.services.export_service import generate_crowns_csv, generate_crowns_geojson

router = APIRouter(prefix="/api", tags=["Forest Analysis"])

# Sample datasets catalog
SAMPLES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../sample-data"))

SAMPLE_CATALOG: List[SampleDatasetInfo] = [
    SampleDatasetInfo(
        id="okanagan-ridge",
        name="Okanagan Ridge Orthomosaic",
        filename="okanagan_ridge_sentinel2_0.3m.png",
        description="Expansive coniferous and deciduous montane canopy captured via high-resolution orthophoto sensor.",
        file_size_display="4.8 MB",
        default_gsd=0.30,
        has_georeference=True,
        sensor_type="Sentinel-2 L2A Orthorectified (0.3m GSD)",
        location="Okanagan Valley, BC (49°53'12\"N, 119°29'40\"W)",
        approx_trees="~800-1,400 trees",
        thumbnail_url="/samples/okanagan_ridge_thumb.png"
    ),
    SampleDatasetInfo(
        id="pine-plantation",
        name="Pine Plantation Managed Stand",
        filename="pine_plantation_aerial_0.15m.png",
        description="Evenly spaced commercial Pinus taeda plantation with distinct crown boundaries and uniform row geometry.",
        file_size_display="3.2 MB",
        default_gsd=0.15,
        has_georeference=True,
        sensor_type="UAV Aerial RGB Orthomosaic (0.15m GSD)",
        location="Georgia Forest Basin, USA",
        approx_trees="~600-1,000 trees",
        thumbnail_url="/samples/pine_plantation_thumb.png"
    ),
    SampleDatasetInfo(
        id="amazon-rainforest",
        name="Amazon High-Density Rainforest Canopy",
        filename="amazon_canopy_dense_0.5m.png",
        description="Ultra-dense multi-tiered tropical rainforest canopy exhibiting complex super-canopy emergence and dense understory.",
        file_size_display="5.4 MB",
        default_gsd=0.50,
        has_georeference=True,
        sensor_type="PlanetScope High-Res Satellite (0.50m GSD)",
        location="Amapá National Forest, Brazil",
        approx_trees="~1,100-1,800 trees",
        thumbnail_url="/samples/amazon_canopy_thumb.png"
    ),
    SampleDatasetInfo(
        id="subalpine-mixed",
        name="Subalpine Mixed Deciduous & Evergreen",
        filename="subalpine_mixed_0.25m.png",
        description="Heterogeneous alpine forest featuring mixed spruce, fir, and birch stands along topographical slope variations.",
        file_size_display="3.9 MB",
        default_gsd=0.25,
        has_georeference=True,
        sensor_type="Maxar WorldView-3 (0.25m GSD)",
        location="Banff Subalpine Zone, Canada",
        approx_trees="~700-1,200 trees",
        thumbnail_url="/samples/subalpine_mixed_thumb.png"
    ),
]


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    summary="Detect tree crowns and calculate canopy metrics from forest imagery"
)
async def analyze_forest_image(
    file: UploadFile = File(..., description="Forest satellite/aerial image (JPG, PNG, TIFF)"),
    gsd: Optional[float] = Form(None, description="Optional custom Ground Sampling Distance in meters/pixel")
):
    """
    Primary analysis endpoint:
    1. Validates and loads raster image.
    2. Runs spectral vegetation extraction and marker-controlled watershed crown segmentation.
    3. Calculates deterministic physical or pixel canopy areas, crown counts, stem densities, and coverage %.
    4. Generates high-resolution vector and raster visualization overlays.
    """
    # 1. Validation
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded.")
    
    # Read bytes with 60MB safety limit
    MAX_BYTES = 60 * 1024 * 1024
    file_bytes = await file.read()
    
    if len(file_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty (0 bytes).")
    
    if len(file_bytes) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds maximum allowed upload size (60MB)."
        )

    try:
        rgb_image, metadata = read_image_from_bytes(file_bytes, filename=file.filename)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to decode image raster: {str(e)}"
        )

    try:
        # 2. Run Computer Vision Pipeline
        pipeline_result = run_tree_crown_detection_pipeline(
            rgb_image=rgb_image,
            metadata=metadata,
            custom_gsd=gsd
        )
        
        # 3. Compute Geospatial & Coverage Metrics
        geo_metrics, geo_meta = compute_geospatial_metrics(
            total_canopy_pixels=pipeline_result["total_canopy_pixels"],
            total_image_pixels=pipeline_result["total_image_pixels"],
            image_width=pipeline_result["image_width"],
            image_height=pipeline_result["image_height"],
            effective_gsd=pipeline_result["effective_gsd"],
            metadata=metadata
        )

        # 4. Compute Structural Analytics & Size Distribution
        analytics_result = compute_forest_analytics(
            crowns_data=pipeline_result["crowns"],
            analyzed_ha=geo_metrics["analyzed_ha"],
            unit=geo_metrics["unit"],
            unit_length=geo_metrics["unit_length"]
        )

        # 5. Generate Annotated Result Overlays
        result_img_b64 = generate_annotated_result_image(
            rgb_image=rgb_image,
            crowns_data=pipeline_result["crowns"],
            canopy_mask=pipeline_result["canopy_mask"]
        )
        
        mask_img_b64 = generate_vegetation_mask_image(pipeline_result["canopy_mask"])

        return AnalysisResponse(
            success=True,
            trees_detected=analytics_result["trees_detected"],
            canopy_area=geo_metrics["canopy_area"],
            analyzed_area=geo_metrics["analyzed_area"],
            canopy_coverage=geo_metrics["canopy_coverage"],
            non_canopy_area=geo_metrics["non_canopy_area"],
            unit=geo_metrics["unit"],
            unit_length=geo_metrics["unit_length"],
            density_stems_per_ha=analytics_result["density_stems_per_ha"],
            mean_crown_diameter=analytics_result["mean_crown_diameter"],
            mean_crown_area=analytics_result["mean_crown_area"],
            geospatial=geo_meta,
            distribution=analytics_result["distribution"],
            result_image=result_img_b64,
            vegetation_mask_image=mask_img_b64,
            crowns=analytics_result["crown_models"],
            uncertain_detections_count=analytics_result["uncertain_detections_count"],
            image_width=pipeline_result["image_width"],
            image_height=pipeline_result["image_height"],
            inference_time_seconds=pipeline_result["inference_time_seconds"],
            stage_timings=pipeline_result["stage_timings"],
            message=f"Successfully segmented {analytics_result['trees_detected']} individual tree crowns."
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline error: {str(e)}"
        )


@router.get("/samples", response_model=List[SampleDatasetInfo], summary="List pre-packaged sample forest datasets")
def list_sample_datasets():
    """Returns catalog of sample satellite datasets available for 1-click evaluation."""
    return SAMPLE_CATALOG


@router.get("/health", summary="Backend health check")
def health_check():
    """Returns backend system and ML engine status."""
    return {
        "status": "healthy",
        "engine": "ForestVision AI Neural & Watershed Segmentation Engine",
        "version": "2.4.0-prod-sat",
        "algorithms": [
            "Excess Green Index (ExG)",
            "Normalized Green Leaf Index (GLI)",
            "Radiometric Scale-Space Apex Filter",
            "Marker-Controlled Watershed Crown Partitioning",
            "Douglas-Peucker Polygon Geometry Extraction"
        ]
    }
