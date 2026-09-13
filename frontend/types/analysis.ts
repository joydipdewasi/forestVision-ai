export interface CrownDetection {
  id: string;
  center_x: number;
  center_y: number;
  radius_px: number;
  radius_m?: number | null;
  area: number;
  area_px: number;
  confidence: number;
  category: string;
  polygon: [number, number][];
  is_uncertain: boolean;
}

export interface DistributionBin {
  label: string;
  count: number;
  percentage: number;
  min_size: number;
  max_size: number;
  unit: string;
}

export interface GeospatialMetadata {
  has_spatial_scale: boolean;
  source: string;
  gsd?: number | null;
  unit: string;
  unit_length: string;
  crs?: string | null;
  disclaimer: string;
}

export interface AnalysisResponse {
  success: boolean;
  trees_detected: number;
  canopy_area: number;
  analyzed_area: number;
  canopy_coverage: number;
  non_canopy_area: number;
  unit: string;
  unit_length: string;
  density_stems_per_ha?: number | null;
  mean_crown_diameter: number;
  mean_crown_area: number;
  geospatial: GeospatialMetadata;
  distribution: DistributionBin[];
  result_image: string;
  vegetation_mask_image?: string | null;
  crowns: CrownDetection[];
  uncertain_detections_count: number;
  image_width: number;
  image_height: number;
  inference_time_seconds: number;
  stage_timings: Record<string, number>;
  message: string;
}

export interface SampleDatasetInfo {
  id: string;
  name: string;
  filename: string;
  description: string;
  file_size_display: string;
  default_gsd: number;
  has_georeference: boolean;
  sensor_type: string;
  location: string;
  approx_trees: string;
  thumbnail_url: string;
}

export type PipelineStage = 
  | 'idle'
  | 'preparing'
  | 'detecting_vegetation'
  | 'segmenting_crowns'
  | 'measuring_canopy'
  | 'complete'
  | 'error';
