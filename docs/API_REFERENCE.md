# ForestVision AI - API Reference

## Base URL
```
http://localhost:8000
```

---

## Endpoints

### 1. `POST /api/analyze`
Executes spectral vegetation extraction, radiometric apex detection, marker-controlled watershed segmentation, and geospatial area scaling.

**Request:** `multipart/form-data`
- `file` (*required*, binary): Image raster (JPG, PNG, TIFF, GeoTIFF). Max 60MB.
- `gsd` (*optional*, float): Ground Sampling Distance in meters/pixel (e.g., `0.30`).

**Response Schema (`200 OK`):**
```json
{
  "success": true,
  "trees_detected": 1247,
  "canopy_area": 18430.5,
  "analyzed_area": 52000.0,
  "canopy_coverage": 35.44,
  "non_canopy_area": 33569.5,
  "unit": "m²",
  "unit_length": "m",
  "density_stems_per_ha": 239.8,
  "mean_crown_diameter": 4.34,
  "mean_crown_area": 14.78,
  "geospatial": {
    "has_spatial_scale": true,
    "source": "Calibrated Sensor GSD",
    "gsd": 0.30,
    "unit": "m²",
    "unit_length": "m",
    "crs": "WGS 84 / UTM 11N",
    "disclaimer": "Calibrated at 0.30m GSD. 1 pixel = 0.09 m²."
  },
  "distribution": [
    {
      "label": "Small / Understory (< 3m)",
      "count": 210,
      "percentage": 16.8,
      "min_size": 0.0,
      "max_size": 3.0,
      "unit": "m"
    },
    {
      "label": "Co-Dominant (3 - 5m)",
      "count": 640,
      "percentage": 51.3,
      "min_size": 3.0,
      "max_size": 5.0,
      "unit": "m"
    }
  ],
  "result_image": "data:image/png;base64,...",
  "vegetation_mask_image": "data:image/png;base64,...",
  "crowns": [
    {
      "id": "FV-0001",
      "center_x": 120.4,
      "center_y": 90.2,
      "radius_px": 14.2,
      "radius_m": 4.26,
      "area": 56.9,
      "area_px": 632.4,
      "confidence": 0.958,
      "category": "Dominant / Mature Crown",
      "polygon": [[110, 80], [130, 82], [125, 100], [110, 80]],
      "is_uncertain": false
    }
  ],
  "uncertain_detections_count": 42,
  "image_width": 1024,
  "image_height": 640,
  "inference_time_seconds": 1.42,
  "stage_timings": {
    "preparing_image": 0.02,
    "detecting_vegetation": 0.28,
    "segmenting_crowns": 0.74,
    "measuring_canopy": 0.38
  },
  "message": "Successfully segmented 1247 individual tree crowns."
}
```

---

### 2. `GET /api/samples`
Returns metadata catalog of pre-packaged test satellite datasets.

---

### 3. `GET /api/health`
Health check and algorithm engine telemetry.
