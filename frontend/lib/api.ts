import { AnalysisResponse, SampleDatasetInfo } from "@/types/analysis";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

export async function analyzeImage(
  file: File | Blob,
  fileName: string = "image.png",
  customGsd?: number | null
): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file, fileName);
  if (customGsd !== undefined && customGsd !== null && customGsd > 0) {
    formData.append("gsd", customGsd.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = "Analysis request failed";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = `Server responded with error status ${response.status}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function fetchSampleCatalog(): Promise<SampleDatasetInfo[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/samples`);
    if (res.ok) {
      return res.json();
    }
  } catch {
    // Fallback to static catalog if backend is momentarily unreachable
  }

  return [
    {
      id: "okanagan-ridge",
      name: "Okanagan Ridge Orthomosaic",
      filename: "okanagan_ridge_sentinel2_0.3m.png",
      description: "Expansive coniferous and deciduous montane canopy captured via high-resolution orthophoto sensor.",
      file_size_display: "4.8 MB",
      default_gsd: 0.30,
      has_georeference: true,
      sensor_type: "Sentinel-2 L2A Orthorectified (0.3m GSD)",
      location: "Okanagan Valley, BC (49°53'12\"N, 119°29'40\"W)",
      approx_trees: "~800-1,400 trees",
      thumbnail_url: "/samples/okanagan_ridge_thumb.png"
    },
    {
      id: "pine-plantation",
      name: "Pine Plantation Managed Stand",
      filename: "pine_plantation_aerial_0.15m.png",
      description: "Evenly spaced commercial Pinus taeda plantation with distinct crown boundaries and uniform row geometry.",
      file_size_display: "3.2 MB",
      default_gsd: 0.15,
      has_georeference: true,
      sensor_type: "UAV Aerial RGB Orthomosaic (0.15m GSD)",
      location: "Georgia Forest Basin, USA",
      approx_trees: "~600-1,000 trees",
      thumbnail_url: "/samples/pine_plantation_thumb.png"
    },
    {
      id: "amazon-rainforest",
      name: "Amazon High-Density Rainforest Canopy",
      filename: "amazon_canopy_dense_0.5m.png",
      description: "Ultra-dense multi-tiered tropical rainforest canopy exhibiting complex super-canopy emergence and dense understory.",
      file_size_display: "5.4 MB",
      default_gsd: 0.50,
      has_georeference: true,
      sensor_type: "PlanetScope High-Res Satellite (0.50m GSD)",
      location: "Amapá National Forest, Brazil",
      approx_trees: "~1,100-1,800 trees",
      thumbnail_url: "/samples/amazon_canopy_thumb.png"
    },
    {
      id: "subalpine-mixed",
      name: "Subalpine Mixed Deciduous & Evergreen",
      filename: "subalpine_mixed_0.25m.png",
      description: "Heterogeneous alpine forest featuring mixed spruce, fir, and birch stands along topographical slope variations.",
      file_size_display: "3.9 MB",
      default_gsd: 0.25,
      has_georeference: true,
      sensor_type: "Maxar WorldView-3 (0.25m GSD)",
      location: "Banff Subalpine Zone, Canada",
      approx_trees: "~700-1,200 trees",
      thumbnail_url: "/samples/subalpine_mixed_thumb.png"
    },
  ];
}
