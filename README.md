# 🌲 ForestVision AI - Canopy Intelligence Platform

> **Production-grade satellite forest canopy analysis platform for hackathon review.**
> Delineates individual tree crowns, measures horizontal canopy cover surface area, and computes deterministic vegetation metrics from high-resolution satellite orthophotos and UAV aerial rasters.

---

## 🚀 Key Features

1. **Individual Tree Crown Delineation & Counting**:
   - Radiometric scale-space apex detection identifies treetop sunlit peaks.
   - Marker-controlled **Watershed Segmentation** isolates contiguous forest foliage into discrete, non-overlapping crowns with precise vector boundary polygons.
2. **Deterministic Canopy Area & Coverage Calculations**:
   - Area Analyzed ($m^2$ or $px^2$), Estimated Canopy Area ($m^2$ or $px^2$), Stem Density (stems/ha), and Canopy Coverage ($\%$).
   - Strictly computed by backend image processing — zero hallucinated LLM measurements.
3. **Geospatial & GSD Scale Calibration**:
   - Reads embedded GeoTIFF metadata tags (`ModelPixelScaleTag`) or supports user-customized sensor Ground Sampling Distance ($m/\text{pixel}$).
   - Transparently flags uncalibrated images as image-space pixels ($px^2$) when scale is unavailable.
4. **Interactive Multispectral Crown Viewer (Stitch Design)**:
   - High-fidelity visualizer with vector polygons, glowing emerald borders, and apex markers.
   - Hover and click inspection HUD: inspect any tree crown ID (`#FV-XXXX`), area, radius, confidence score, and maturity category.
   - Layer toggles (Original vs Detection overlay, Apexes, Fills) and Zoom/Pan controls.
5. **Visual Coverage Analytics**:
   - SVG Donut Chart showing Active Canopy vs Open Ground/Trails/Rocks.
   - Structural density bars and crown diameter classification distribution histogram.
6. **Institutional Export Hub**:
   - High-Resolution Annotated PNG Image export.
   - Telemetry CSV export (tree-by-tree coordinates, area, radius, class, confidence).
   - GeoJSON FeatureCollection export for GIS software (QGIS, ArcGIS).
   - Printable compliance summary report.
7. **Pre-Packaged 1-Click Satellite Test Datasets**:
   - Okanagan Ridge Orthomosaic (Sentinel-2 L2A, 0.3m GSD)
   - Pine Plantation Managed Stand (UAV Aerial, 0.15m GSD)
   - Amazon High-Density Rainforest Canopy (PlanetScope, 0.5m GSD)
   - Subalpine Mixed Deciduous & Evergreen (Maxar WorldView-3, 0.25m GSD)

---

## 🛠️ Architecture & Monorepo Structure

```
forestvision/
├── frontend/                  # Next.js (TypeScript, React, Tailwind CSS)
│   ├── app/                   # App Router pages & layout
│   ├── components/            # Stitch design UI components
│   ├── lib/                   # API client & sample catalog
│   ├── public/samples/        # Static satellite sample images & thumbnails
│   └── types/                 # TypeScript interfaces
│
├── backend/                   # Python FastAPI Backend
│   ├── app/
│   │   ├── api/routes.py      # /api/analyze, /api/samples, /api/health
│   │   ├── detection/         # Crown detection & watershed segmentation
│   │   ├── processing/        # Geospatial scaling & structural analytics
│   │   ├── services/          # Visualizer overlays & CSV/GeoJSON export
│   │   ├── schemas/           # Pydantic models
│   │   └── utils/image_io.py  # Safe GeoTIFF, PNG, JPG decoders
│   ├── tests/test_pipeline.py # Pytest unit & integration test suite
│   └── requirements.txt
│
├── sample-data/               # High-res sample rasters & GeoTIFFs
├── docs/                      # Scientific methodology & API reference
└── README.md
```

---

## 🏃 Running Locally

### 1. Backend Setup
```bash
cd backend
# Create virtual environment & install requirements
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

# Run FastAPI backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Web application will be live at: `http://localhost:3000`

### 3. Running Automated Tests
```bash
cd backend
pytest tests/test_pipeline.py -v
```

---

## 🔬 Scientific Methodology & Integrity
- **Zero AI Hallucinations**: Real computer vision algorithms (Excess Green Index $ExG = 2G - R - B$, Gaussian scale-space apex detection, Marker-Controlled Watershed flood-filling).
- **Honest Limitations**: Results communicate sensor ground sampling distance (GSD), overlapping tree crowns, and terrain shadow caveats. Field verification is advised prior to formal carbon registry issuance.
