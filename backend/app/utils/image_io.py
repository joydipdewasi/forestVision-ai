"""Image input/output utilities with robust GeoTIFF, PNG, and JPG support."""

import io
import base64
from typing import Tuple, Dict, Any, Optional
import numpy as np
import cv2
from PIL import Image
import tifffile


def read_image_from_bytes(file_bytes: bytes, filename: str = "") -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Safely reads an image from raw bytes supporting GeoTIFF, TIFF, PNG, and JPG.
    Returns:
        (rgb_image, metadata_dict)
        where rgb_image is uint8 (H, W, 3) in RGB format.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise ValueError("Uploaded file is empty.")

    metadata: Dict[str, Any] = {
        "filename": filename,
        "file_size_bytes": len(file_bytes),
        "is_geotiff": False,
        "gsd": None,
        "crs": None,
        "tags": {}
    }

    lower_name = filename.lower()
    is_tiff = lower_name.endswith(('.tif', '.tiff')) or file_bytes[:4] in (b'II*\x00', b'MM\x00*')

    rgb_array: Optional[np.ndarray] = None

    if is_tiff:
        try:
            with tifffile.TiffFile(io.BytesIO(file_bytes)) as tif:
                metadata["is_geotiff"] = True
                page = tif.pages[0]
                
                # Check for ModelPixelScaleTag (GeoTIFF Tag 33550: [ScaleX, ScaleY, ScaleZ] in meters)
                if hasattr(page, 'tags'):
                    # Check tag by code 33550 or name
                    if 33550 in page.tags:
                        scale_val = page.tags[33550].value
                        if hasattr(scale_val, '__iter__') and len(scale_val) >= 2:
                            metadata["gsd"] = float((scale_val[0] + scale_val[1]) / 2.0)
                    elif 'ModelPixelScaleTag' in page.tags:
                        scale_val = page.tags['ModelPixelScaleTag'].value
                        if hasattr(scale_val, '__iter__') and len(scale_val) >= 2:
                            metadata["gsd"] = float((scale_val[0] + scale_val[1]) / 2.0)

                if metadata["gsd"] is None and hasattr(page, 'geotiff_tags') and page.geotiff_tags:
                    tags = page.geotiff_tags
                    if 'ModelPixelScale' in tags:
                        scale = tags['ModelPixelScale']
                        if len(scale) >= 2:
                            metadata["gsd"] = float((scale[0] + scale[1]) / 2.0)
                    if 'ProjectedCSType' in tags:
                        metadata["crs"] = f"EPSG:{tags['ProjectedCSType']}"
                    elif 'GeographicType' in tags:
                        metadata["crs"] = f"EPSG:{tags['GeographicType']}"

                raw_data = page.asarray()
                
                # Handle multi-band / multi-channel TIFFs
                if raw_data.ndim == 2:
                    # Grayscale
                    if raw_data.dtype != np.uint8:
                        norm = cv2.normalize(raw_data, None, 0, 255, cv2.NORM_MINMAX)
                        raw_data = norm.astype(np.uint8)
                    rgb_array = cv2.cvtColor(raw_data, cv2.COLOR_GRAY2RGB)
                elif raw_data.ndim == 3:
                    # If channels-first (e.g. 3, H, W or 4, H, W)
                    if raw_data.shape[0] in (3, 4) and raw_data.shape[0] < raw_data.shape[1]:
                        raw_data = np.transpose(raw_data, (1, 2, 0))
                    
                    # Take first 3 bands (RGB)
                    if raw_data.shape[2] >= 3:
                        rgb_subset = raw_data[:, :, :3]
                    else:
                        rgb_subset = cv2.cvtColor(raw_data[:, :, 0], cv2.COLOR_GRAY2RGB)
                        
                    if rgb_subset.dtype != np.uint8:
                        # Normalize 16-bit or float multispectral data to 8-bit RGB
                        norm = np.zeros_like(rgb_subset, dtype=np.uint8)
                        for c in range(rgb_subset.shape[2]):
                            ch = rgb_subset[:, :, c]
                            p2, p98 = np.percentile(ch, (2, 98))
                            if p98 > p2:
                                ch_clipped = np.clip(ch, p2, p98)
                                norm[:, :, c] = ((ch_clipped - p2) / (p98 - p2) * 255.0).astype(np.uint8)
                            else:
                                norm[:, :, c] = cv2.normalize(ch, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
                        rgb_array = norm
                    else:
                        rgb_array = rgb_subset

        except Exception as e:
            # Fallback to PIL / cv2 if tifffile failed
            pass

    if rgb_array is None:
        try:
            # Try PIL
            pil_img = Image.open(io.BytesIO(file_bytes))
            # Convert to RGB (handles RGBA, Palette, Grayscale)
            if pil_img.mode != 'RGB':
                pil_img = pil_img.convert('RGB')
            rgb_array = np.array(pil_img)
        except Exception:
            # Try cv2 imdecode
            np_arr = np.frombuffer(file_bytes, np.uint8)
            bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if bgr is None:
                raise ValueError("Could not decode image. Please ensure the file is a valid JPG, PNG, or TIFF raster.")
            rgb_array = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

    if rgb_array is None or rgb_array.size == 0:
        raise ValueError("Decoded image is empty.")

    h, w = rgb_array.shape[:2]
    metadata["width"] = w
    metadata["height"] = h

    # Safety limit: if image is excessively large (> 4096px on a side), downsample with scale preservation
    MAX_DIM = 3200
    if max(h, w) > MAX_DIM:
        scale_factor = MAX_DIM / max(h, w)
        new_w = int(w * scale_factor)
        new_h = int(h * scale_factor)
        rgb_array = cv2.resize(rgb_array, (new_w, new_h), interpolation=cv2.INTER_AREA)
        if metadata.get("gsd"):
            metadata["gsd"] = metadata["gsd"] / scale_factor
        metadata["rescaled_from"] = (w, h)
        metadata["width"] = new_w
        metadata["height"] = new_h

    return rgb_array, metadata


def image_to_base64_png(rgb_image: np.ndarray, quality: int = 90) -> str:
    """Encodes an RGB numpy array to a base64 PNG/JPEG data URL."""
    bgr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
    success, buffer = cv2.imencode('.png', bgr)
    if not success:
        raise RuntimeError("Failed to encode image to PNG buffer.")
    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/png;base64,{b64_str}"


def mask_to_base64_png(mask: np.ndarray) -> str:
    """Encodes a single channel binary/grayscale mask to a base64 PNG data URL."""
    success, buffer = cv2.imencode('.png', mask)
    if not success:
        raise RuntimeError("Failed to encode mask to PNG buffer.")
    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/png;base64,{b64_str}"
