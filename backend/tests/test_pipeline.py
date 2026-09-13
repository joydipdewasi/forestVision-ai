"""Comprehensive unit and integration test suite for ForestVision AI."""

import os
import io
import pytest
import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.detection.vegetation import extract_vegetation_canopy_mask
from app.detection.crown_extractor import detect_treetop_apexes, segment_crowns_watershed, extract_crown_polygons_and_metrics
from app.detection.pipeline import run_tree_crown_detection_pipeline
from app.processing.geospatial import compute_geospatial_metrics
from app.processing.analytics import compute_forest_analytics
from app.utils.image_io import read_image_from_bytes, image_to_base64_png

client = TestClient(app)
SAMPLES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample-data"))
if not os.path.exists(os.path.join(SAMPLES_DIR, "okanagan_ridge_sentinel2_0.3m.png")):
    SAMPLES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../sample-data"))
if not os.path.exists(os.path.join(SAMPLES_DIR, "okanagan_ridge_sentinel2_0.3m.png")):
    SAMPLES_DIR = "d:/coding/forestVision ai/sample-data"


def test_health_endpoint():
    """Verify backend health check returns operational status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_samples_catalog_endpoint():
    """Verify sample datasets catalog returns valid records."""
    response = client.get("/api/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) >= 4
    assert any(s["id"] == "okanagan-ridge" for s in samples)


def test_vegetation_canopy_extraction():
    """Test spectral vegetation index on synthetic forest tile."""
    # Create test RGB image with a green tree crown in center and gray soil around
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    img[:, :] = [100, 90, 70] # soil background
    # Green crown
    img[30:70, 30:70] = [40, 160, 60]
    
    mask = extract_vegetation_canopy_mask(img)
    assert mask.shape == (100, 100)
    # Center should be identified as canopy
    assert np.mean(mask[40:60, 40:60]) > 200
    # Background should be 0
    assert np.mean(mask[5:15, 5:15]) == 0


def test_watershed_crown_segmentation():
    """Test peak detection and marker-controlled watershed segmentation."""
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    img[:, :] = [100, 90, 70]
    # Two distinct trees
    img[20:45, 20:45] = [35, 170, 50]
    img[55:80, 55:80] = [35, 170, 50]
    
    mask = extract_vegetation_canopy_mask(img)
    peaks = detect_treetop_apexes(img, mask, min_distance_px=5)
    labels, num_peaks = segment_crowns_watershed(img, mask, peaks)
    
    crowns = extract_crown_polygons_and_metrics(labels, mask, img, gsd=0.3)
    assert len(crowns) >= 2
    for c in crowns:
        assert c["area"] > 0
        assert len(c["polygon"]) >= 3
        assert "FV-" in c["id"]


def test_deterministic_calculations():
    """Verify mathematical determinism of area, coverage, and density calculations."""
    total_canopy_px = 25000
    total_image_px = 100000
    w, h = 400, 250
    gsd = 0.5 # 1 pixel = 0.25 m²

    metrics, geo_meta = compute_geospatial_metrics(
        total_canopy_pixels=total_canopy_px,
        total_image_pixels=total_image_px,
        image_width=w,
        image_height=h,
        effective_gsd=gsd,
        metadata={"is_geotiff": False}
    )

    # 25000 * 0.25 = 6250.0 m²
    assert metrics["canopy_area"] == 6250.0
    # 100000 * 0.25 = 25000.0 m²
    assert metrics["analyzed_area"] == 25000.0
    # 6250 / 25000 * 100 = 25.0 %
    assert metrics["canopy_coverage"] == 25.0
    assert metrics["unit"] == "m²"
    assert geo_meta.has_spatial_scale is True


def test_uncalibrated_image_space():
    """Verify honest reporting when no spatial scale or GSD is supplied."""
    metrics, geo_meta = compute_geospatial_metrics(
        total_canopy_pixels=1500,
        total_image_pixels=5000,
        image_width=100,
        image_height=50,
        effective_gsd=None,
        metadata={"is_geotiff": False}
    )

    assert metrics["canopy_area"] == 1500.0
    assert metrics["analyzed_area"] == 5000.0
    assert metrics["canopy_coverage"] == 30.0
    assert metrics["unit"] == "px²"
    assert geo_meta.has_spatial_scale is False
    assert "image-space" in geo_meta.disclaimer.lower()


def test_api_analyze_sample_image():
    """Integration test: submit sample PNG to /api/analyze."""
    sample_file = os.path.join(SAMPLES_DIR, "okanagan_ridge_sentinel2_0.3m.png")
    if not os.path.exists(sample_file):
        pytest.skip("Sample file not yet generated")

    with open(sample_file, "rb") as f:
        response = client.post(
            "/api/analyze",
            files={"file": ("okanagan_ridge.png", f, "image/png")},
            data={"gsd": "0.30"}
        )

    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["trees_detected"] > 50
    assert res["canopy_area"] > 0
    assert res["analyzed_area"] > 0
    assert 0 < res["canopy_coverage"] <= 100
    assert res["unit"] == "m²"
    assert len(res["crowns"]) == res["trees_detected"]
    assert res["result_image"].startswith("data:image/png;base64,")


def test_api_analyze_geotiff():
    """Integration test: submit sample GeoTIFF with embedded scale tag to /api/analyze."""
    sample_tif = os.path.join(SAMPLES_DIR, "okanagan_ridge_sentinel2_0.3m.tif")
    if not os.path.exists(sample_tif):
        pytest.skip("Sample GeoTIFF not yet generated")

    with open(sample_tif, "rb") as f:
        response = client.post(
            "/api/analyze",
            files={"file": ("okanagan_ridge.tif", f, "image/tiff")}
        )

    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["geospatial"]["has_spatial_scale"] is True
    assert res["geospatial"]["gsd"] == 0.30


def test_api_error_handling_empty_file():
    """Verify that empty file uploads return HTTP 400 Bad Request."""
    response = client.post(
        "/api/analyze",
        files={"file": ("empty.png", b"", "image/png")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_api_error_handling_invalid_bytes():
    """Verify that corrupted non-image files return HTTP 422 Unprocessable Entity."""
    response = client.post(
        "/api/analyze",
        files={"file": ("corrupted.png", b"this is not an image file", "image/png")}
    )
    assert response.status_code == 422
