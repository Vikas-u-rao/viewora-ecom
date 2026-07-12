import argparse
import sys
import json
import urllib.request
import os
from pathlib import Path
from PIL import Image

# Colors for terminal output
class colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'

def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))

def find_product_bbox(img: Image.Image, bg_threshold: int) -> tuple[int, int, int, int] | None:
    """
    Returns the bounding box (left, upper, right, lower) of non-background
    content, or None if the image appears to be entirely background.
    """
    gray = img.convert("L")
    # Pixels darker than bg_threshold are treated as "product".
    mask = gray.point(lambda p: 255 if p < bg_threshold else 0)
    bbox = mask.getbbox()
    return bbox

def download_image(url: str, temp_path: Path):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as response, open(temp_path, 'wb') as out_file:
        out_file.write(response.read())

def process_image(
    src_path: Path,
    dst_path: Path,
    canvas_size: int,
    padding_pct: float,
    bg_color: tuple[int, int, int],
    bg_threshold: int,
) -> str:
    img = Image.open(src_path).convert("RGB")

    bbox = find_product_bbox(img, bg_threshold)
    if bbox is None:
        cropped = img
    else:
        # add a tiny safety margin so we don't clip antialiased edges
        left, upper, right, lower = bbox
        safety = 6
        left = max(0, left - safety)
        upper = max(0, upper - safety)
        right = min(img.width, right + safety)
        lower = min(img.height, lower + safety)
        cropped = img.crop((left, upper, right, lower))

    # Target area inside the canvas after padding on all sides
    padding_px = int(canvas_size * (padding_pct / 100))
    target_dim = canvas_size - 2 * padding_px

    # Scale the cropped product to fit inside target_dim x target_dim, preserving aspect ratio
    scale = min(target_dim / cropped.width, target_dim / cropped.height)
    new_w = max(1, int(cropped.width * scale))
    new_h = max(1, int(cropped.height * scale))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", (canvas_size, canvas_size), bg_color)
    offset_x = (canvas_size - new_w) // 2
    offset_y = (canvas_size - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y))

    dst_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dst_path, quality=92)
    return f"{src_path.name}: {img.size} -> cropped {cropped.size} -> placed as {new_w}x{new_h} on {canvas_size}x{canvas_size}"

def main():
    parser = argparse.ArgumentParser(description="Downloads and standardizes all VIEWORA catalogue images locally.")
    parser.add_argument("--canvas-size", type=int, default=800, help="Output canvas size in px (square)")
    parser.add_argument("--padding-pct", type=float, default=12, help="Padding percent per side")
    parser.add_argument("--bg-color", default="#F0EDE4", help="Canvas background hex color")
    parser.add_argument("--bg-threshold", type=int, default=235, help="Brightness cutoff for background detection")
    args = parser.parse_args()

    prisma_dir = Path(__file__).parent.resolve()
    scraped_json_path = prisma_dir / "scraped_products.json"
    
    client_dir = prisma_dir.parent.parent / "client"
    output_dir = client_dir / "public" / "images" / "normalized"
    temp_dir = prisma_dir / "temp_raw_photos"

    bg_rgb = hex_to_rgb(args.bg_color)

    if not scraped_json_path.exists():
        print(f"{colors.RED}Error: scraped_products.json not found in {prisma_dir}{colors.RESET}", file=sys.stderr)
        sys.exit(1)

    with open(scraped_json_path, "r", encoding="utf-8") as f:
        products = json.load(f)

    print(f"Loaded {len(products)} products from scraped_products.json.")
    temp_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    success_count = 0

    for idx, product in enumerate(products):
        name = product.get("name", "Unknown Product")
        brand = product.get("brand", "").lower().strip()
        slug = name.lower().replace(" ", "-").replace("/", "-").replace("&", "-").replace("(", "").replace(")", "").replace("--", "-").strip("-")
        
        image_urls = product.get("imageUrls", [])
        if not image_urls:
            print(f"[{idx+1}/{len(products)}] {colors.YELLOW}No images for {name}. Using brand fallback.{colors.RESET}")
            # Map fallback
            fallback_name = f"{brand.replace(' ', '-')}.png"
            src_path = client_dir / "public" / "images" / "products" / fallback_name
            if not src_path.exists():
                src_path = client_dir / "public" / "images" / "products" / "ray-ban.png" # general fallback
        else:
            primary_url = image_urls[0]
            src_path = temp_dir / f"{slug}.png"
            if primary_url.startswith("http"):
                try:
                    print(f"[{idx+1}/{len(products)}] Downloading {name} image...")
                    download_image(primary_url, src_path)
                except Exception as e:
                    print(f"  {colors.RED}Download failed: {e}. Using brand fallback.{colors.RESET}")
                    # Map fallback
                    fallback_name = f"{brand.replace(' ', '-')}.png"
                    src_path = client_dir / "public" / "images" / "products" / fallback_name
            else:
                # Local path
                src_path = client_dir / "public" / primary_url.lstrip("/")

        # Run normalization
        dst_path = output_dir / f"{slug}.png"
        try:
            if src_path.exists():
                log_info = process_image(src_path, dst_path, args.canvas_size, args.padding_pct, bg_rgb, args.bg_threshold)
                print(f"  {colors.GREEN}Normalized: {log_info}{colors.RESET}")
                
                # Update product record to point to local normalized image URL
                product["imageUrls"] = [f"/images/normalized/{slug}.png"]
                success_count += 1
            else:
                print(f"  {colors.RED}Source image not found: {src_path}{colors.RESET}")
        except Exception as e:
            print(f"  {colors.RED}Processing failed: {e}{colors.RESET}")

    # Write changes back to scraped_products.json
    with open(scraped_json_path, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    print(f"\n{colors.GREEN}[SUCCESS] Completed standardizing {success_count} images.{colors.RESET}")
    print(f"scraped_products.json updated with local normalized paths.")

if __name__ == "__main__":
    main()
