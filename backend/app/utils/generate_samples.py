import os
import math
import numpy as np
import cv2
from PIL import Image
import tifffile

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "sample-data")
FRONTEND_SAMPLES_DIR = os.path.join(PROJECT_ROOT, "frontend/public/samples")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(FRONTEND_SAMPLES_DIR, exist_ok=True)


def generate_synthetic_forest(
    width=1000,
    height=600,
    num_trees=350,
    forest_type="conifer",
    seed=42
):
    """
    Generates a realistic top-down satellite/aerial orthophoto of forest canopy.
    Simulates:
    - Base terrain with natural soil, rock, grass color variations
    - Winding dirt trails / clearings
    - Multi-layered tree crowns with sunlit highlights and cast shadows
    - Natural Perlin/fractal texture noise
    """
    np.random.seed(seed)
    
    # 1. Base terrain background (soil, forest floor, subtle moss)
    canvas = np.zeros((height, width, 3), dtype=np.float32)
    # Earthy dark olive / soil baseline
    canvas[:, :, 0] = 35 + np.random.normal(0, 4, (height, width))  # R
    canvas[:, :, 1] = 48 + np.random.normal(0, 5, (height, width))  # G
    canvas[:, :, 2] = 30 + np.random.normal(0, 3, (height, width))  # B

    # 2. Add winding trail / clearing through terrain
    trail_mask = np.zeros((height, width), dtype=np.uint8)
    trail_pts = []
    curr_x = int(width * 0.1)
    curr_y = int(height * 0.85)
    for i in range(12):
        curr_x += int(width * 0.08 + np.random.randint(-15, 25))
        curr_y += int(np.random.randint(-50, 20))
        curr_y = max(100, min(height - 100, curr_y))
        trail_pts.append([curr_x, curr_y])
        
    pts = np.array(trail_pts, dtype=np.int32).reshape((-1, 1, 2))
    cv2.polylines(trail_mask, [pts], isClosed=False, color=255, thickness=22)
    trail_mask_blurred = cv2.GaussianBlur(trail_mask, (21, 21), 8) / 255.0
    
    # Soil/gravel trail color (R: 110, G: 95, B: 75)
    for c, val in enumerate([115, 100, 80]):
        canvas[:, :, c] = canvas[:, :, c] * (1.0 - trail_mask_blurred) + val * trail_mask_blurred

    # 3. Generate individual tree crowns
    # Sunlight direction: top-left (dx = -0.3, dy = -0.3)
    crown_list = []
    
    # Grid with jitter for natural or plantation distribution
    if forest_type == "plantation":
        rows = 18
        cols = 30
        dx = width / cols
        dy = height / rows
        for r in range(rows):
            for c in range(cols):
                if np.random.rand() < 0.12: # Skip a few for gaps
                    continue
                tx = int(c * dx + dx / 2 + np.random.uniform(-dx * 0.25, dx * 0.25))
                ty = int(r * dy + dy / 2 + np.random.uniform(-dy * 0.25, dy * 0.25))
                # Skip if on trail
                if 0 <= tx < width and 0 <= ty < height and trail_mask_blurred[ty, tx] > 0.4:
                    continue
                rad = np.random.uniform(9, 15)
                crown_list.append((tx, ty, rad))
    else:
        # Clustered natural distribution
        for _ in range(num_trees):
            tx = np.random.randint(20, width - 20)
            ty = np.random.randint(20, height - 20)
            if trail_mask_blurred[ty, tx] > 0.35 and np.random.rand() > 0.15:
                continue
            if forest_type == "amazon":
                rad = np.random.uniform(10, 26)
            elif forest_type == "mixed":
                rad = np.random.uniform(8, 20)
            else:
                rad = np.random.uniform(9, 18)
            crown_list.append((tx, ty, rad))

    # Sort crowns by Y to handle natural shadow rendering
    crown_list.sort(key=lambda item: item[1])

    # Draw crowns with sunlit apex and shadow
    for tx, ty, rad in crown_list:
        irad = int(math.ceil(rad))
        y_min = max(0, ty - irad * 2)
        y_max = min(height, ty + irad * 2)
        x_min = max(0, tx - irad * 2)
        x_max = min(width, tx + irad * 2)

        # Cast shadow on bottom-right
        sh_offset_x = int(rad * 0.4)
        sh_offset_y = int(rad * 0.4)
        cv2.circle(canvas, (tx + sh_offset_x, ty + sh_offset_y), int(rad * 1.1), (15, 22, 12), -1, lineType=cv2.LINE_AA)

    # Now draw canopy foliage
    grid_x, grid_y = np.meshgrid(np.arange(width), np.arange(height))

    for tx, ty, rad in crown_list:
        irad = int(math.ceil(rad))
        
        # Determine species palette
        if forest_type == "conifer":
            # Deep pine green to emerald apex
            base_r, base_g, base_b = (20, 65, 30)
            apex_r, apex_g, apex_b = (55, 155, 75)
        elif forest_type == "plantation":
            base_r, base_g, base_b = (25, 75, 35)
            apex_r, apex_g, apex_b = (65, 170, 85)
        elif forest_type == "amazon":
            # Vibrant tropical emerald & olive
            is_broadleaf = np.random.rand() > 0.3
            if is_broadleaf:
                base_r, base_g, base_b = (30, 85, 35)
                apex_r, apex_g, apex_b = (75, 185, 80)
            else:
                base_r, base_g, base_b = (45, 95, 30)
                apex_r, apex_g, apex_b = (110, 195, 60)
        else: # mixed
            is_deciduous = np.random.rand() > 0.4
            if is_deciduous:
                base_r, base_g, base_b = (40, 95, 35)
                apex_r, apex_g, apex_b = (85, 175, 70)
            else:
                base_r, base_g, base_b = (18, 60, 28)
                apex_r, apex_g, apex_b = (50, 140, 65)

        # Draw radially illuminated crown
        # Bounding box crop for efficiency
        x0 = max(0, int(tx - irad * 1.5))
        x1 = min(width, int(tx + irad * 1.5 + 1))
        y0 = max(0, int(ty - irad * 1.5))
        y1 = min(height, int(ty + irad * 1.5 + 1))

        sub_gx = grid_x[y0:y1, x0:x1]
        sub_gy = grid_y[y0:y1, x0:x1]
        dist_sq = (sub_gx - tx)**2 + (sub_gy - ty)**2
        mask = dist_sq <= rad**2

        if np.any(mask):
            dist = np.sqrt(dist_sq[mask])
            factor = np.clip(1.0 - (dist / rad), 0.0, 1.0)
            
            sun_offset = np.sqrt((sub_gx[mask] - (tx - rad*0.25))**2 + (sub_gy[mask] - (ty - rad*0.25))**2)
            sun_factor = np.clip(1.0 - (sun_offset / (rad * 1.15)), 0.0, 1.0)
            
            foliage_r = base_r + (apex_r - base_r) * (0.35 * factor + 0.65 * sun_factor)
            foliage_g = base_g + (apex_g - base_g) * (0.35 * factor + 0.65 * sun_factor)
            foliage_b = base_b + (apex_b - base_b) * (0.35 * factor + 0.65 * sun_factor)

            noise = np.random.normal(0, 4, foliage_r.shape)
            foliage_r = np.clip(foliage_r + noise, 0, 255)
            foliage_g = np.clip(foliage_g + noise, 0, 255)
            foliage_b = np.clip(foliage_b + noise, 0, 255)

            sub_canvas = canvas[y0:y1, x0:x1]
            sub_canvas[mask, 0] = foliage_r
            sub_canvas[mask, 1] = foliage_g
            sub_canvas[mask, 2] = foliage_b

    # Final overall natural blur / atmospheric diffusion
    canvas_clipped = np.clip(canvas, 0, 255).astype(np.uint8)
    return canvas_clipped


def build_all_samples():
    print("Generating high-resolution sample datasets...")
    
    samples_meta = [
        ("okanagan_ridge_sentinel2_0.3m", 1024, 640, 420, "conifer", 101, 0.30),
        ("pine_plantation_aerial_0.15m", 1024, 640, 480, "plantation", 202, 0.15),
        ("amazon_canopy_dense_0.5m", 1024, 640, 550, "amazon", 303, 0.50),
        ("subalpine_mixed_0.25m", 1024, 640, 380, "mixed", 404, 0.25),
    ]

    for name, w, h, trees, ftype, seed, gsd in samples_meta:
        img = generate_synthetic_forest(width=w, height=h, num_trees=trees, forest_type=ftype, seed=seed)
        
        # 1. Save PNG in sample-data
        png_path = os.path.join(OUTPUT_DIR, f"{name}.png")
        cv2.imwrite(png_path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        
        # 2. Save GeoTIFF with ModelPixelScaleTag
        tif_path = os.path.join(OUTPUT_DIR, f"{name}.tif")
        tifffile.imwrite(
            tif_path,
            img,
            extratags=[
                (33550, 'd', 3, (gsd, gsd, 0.0), False), # ModelPixelScaleTag
                (34735, 's', 0, "WGS 84 / UTM 11N", False), # GeoKeyDirectoryTag
            ]
        )

        # 3. Copy to frontend public samples for 1-click browser testing
        frontend_png = os.path.join(FRONTEND_SAMPLES_DIR, f"{name}.png")
        cv2.imwrite(frontend_png, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        
        # 4. Generate thumbnail (320x200)
        thumb = cv2.resize(img, (320, 200), interpolation=cv2.INTER_AREA)
        thumb_name = name.split("_")[0] + "_" + name.split("_")[1] + "_thumb.png"
        thumb_path = os.path.join(FRONTEND_SAMPLES_DIR, thumb_name)
        cv2.imwrite(thumb_path, cv2.cvtColor(thumb, cv2.COLOR_RGB2BGR))
        
        print(f"  [OK] Created {name}.png, {name}.tif, and {thumb_name}")

    print("All sample datasets successfully generated.")


if __name__ == "__main__":
    build_all_samples()
