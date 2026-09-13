"""Pydantic schemas for ForestVision AI analysis requests and responses."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CrownDetection(BaseModel):
    id: str = Field(..., description="Unique tree crown identifier (e.g. FV-001)")
    center_x: float = Field(..., description="Apex X coordinate in pixels")
    center_y: float = Field(..., description="Apex Y coordinate in pixels")
    radius_px: float = Field(..., description="Equivalent circular radius in pixels")
    radius_m: Optional[float] = Field(None, description="Equivalent circular radius in meters if calibrated")
    area: float = Field(..., description="Crown surface area in selected unit (m² or px²)")
    area_px: float = Field(..., description="Crown surface area in pixels")
    confidence: float = Field(..., description="Detection confidence score (0.0 to 1.0)")
    category: str = Field(..., description="Crown classification (e.g. Dominant Mature, Medium Canopy, Understory)")
    polygon: List[List[float]] = Field(..., description="Simplified boundary polygon [[x, y], ...]")
    is_uncertain: bool = Field(False, description="Flagged if located in heavy shadow or occluded edge")


class DistributionBin(BaseModel):
    label: str = Field(..., description="Size category label")
    count: int = Field(..., description="Number of trees in this bin")
    percentage: float = Field(..., description="Percentage of total detected trees")
    min_size: float = Field(..., description="Minimum size threshold")
    max_size: float = Field(..., description="Maximum size threshold")
    unit: str = Field(..., description="Unit (m or px)")


class GeospatialMetadata(BaseModel):
    has_spatial_scale: bool = Field(..., description="True if real-world spatial scale is calibrated")
    source: str = Field(..., description="Scale calibration source (GeoTIFF Metadata, User Provided GSD, or Uncalibrated)")
    gsd: Optional[float] = Field(None, description="Ground Sampling Distance in meters per pixel")
    unit: str = Field("m²", description="Primary unit of surface area (m² or px²)")
    unit_length: str = Field("m", description="Primary unit of length (m or px)")
    crs: Optional[str] = Field(None, description="Coordinate Reference System if present in GeoTIFF")
    disclaimer: str = Field(..., description="Transparent explanation of measurement scaling")


class StageTiming(BaseModel):
    stage_name: str
    duration_seconds: float


class AnalysisResponse(BaseModel):
    success: bool = Field(True, description="True if analysis succeeded")
    trees_detected: int = Field(..., description="Total count of valid detected individual tree crowns")
    canopy_area: float = Field(..., description="Total estimated horizontal canopy cover area")
    analyzed_area: float = Field(..., description="Total surveyed area represented by the image boundary")
    canopy_coverage: float = Field(..., description="Canopy coverage percentage (canopy_area / analyzed_area * 100)")
    non_canopy_area: float = Field(..., description="Open ground, trail, water, or non-canopy area")
    
    unit: str = Field("m²", description="Area measurement unit (m² or px²)")
    unit_length: str = Field("m", description="Linear measurement unit (m or px)")
    
    density_stems_per_ha: Optional[float] = Field(None, description="Stem density in trees/hectare if scale available")
    mean_crown_diameter: float = Field(..., description="Average crown diameter in length units")
    mean_crown_area: float = Field(..., description="Average individual crown area in area units")
    
    geospatial: GeospatialMetadata = Field(..., description="Spatial scale calibration details")
    distribution: List[DistributionBin] = Field(default_factory=list, description="Crown size distribution histogram")
    
    result_image: str = Field(..., description="Base64 data URL of the high-res annotated result image")
    vegetation_mask_image: Optional[str] = Field(None, description="Base64 data URL of binary canopy mask")
    
    crowns: List[CrownDetection] = Field(default_factory=list, description="List of individual crown features")
    uncertain_detections_count: int = Field(0, description="Count of detections flagged as uncertain")
    
    image_width: int = Field(..., description="Original image width in pixels")
    image_height: int = Field(..., description="Original image height in pixels")
    
    inference_time_seconds: float = Field(..., description="Total analysis duration in seconds")
    stage_timings: Dict[str, float] = Field(default_factory=dict, description="Execution time per pipeline stage")
    
    message: str = Field("Analysis completed successfully", description="Summary status message")


class SampleDatasetInfo(BaseModel):
    id: str
    name: str
    filename: str
    description: str
    file_size_display: str
    default_gsd: float
    has_georeference: bool
    sensor_type: str
    location: str
    approx_trees: str
    thumbnail_url: str
