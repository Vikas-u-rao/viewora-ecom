import csv
import json
import os
import re
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

# Brand Collection URLs categorized as specified
FRAME_BRANDS = [
    "https://jaiswalopticals.com/collections/gucci/products.json",
    "https://jaiswalopticals.com/collections/lacoste-1/products.json",
    "https://jaiswalopticals.com/collections/marc-jacob-1/products.json",
    "https://jaiswalopticals.com/collections/maui-jim-1/products.json",
    "https://jaiswalopticals.com/collections/mont-blanc-1/products.json",
    "https://jaiswalopticals.com/collections/michael-kors/products.json",
    "https://jaiswalopticals.com/collections/oakley/products.json",
    "https://jaiswalopticals.com/collections/off-white-1/products.json",
    "https://jaiswalopticals.com/collections/persol/products.json",
    "https://jaiswalopticals.com/collections/polaroid/products.json",
    "https://jaiswalopticals.com/collections/police/products.json",
    "https://jaiswalopticals.com/collections/philippe-v-1/products.json",
    "https://jaiswalopticals.com/collections/philipp-plein-1/products.json",
    "https://jaiswalopticals.com/collections/ralph-lauren/products.json",
    "https://jaiswalopticals.com/collections/rayban/products.json",
    "https://jaiswalopticals.com/collections/rayban-meta/products.json",
    "https://jaiswalopticals.com/collections/rayban-meta-gen-2/products.json",
    "https://jaiswalopticals.com/collections/salvatore-ferragamo/products.json",
    "https://jaiswalopticals.com/collections/stepper/products.json",
    "https://jaiswalopticals.com/collections/saint-laurent-1/products.json",
    "https://jaiswalopticals.com/collections/tom-ford/products.json",
    "https://jaiswalopticals.com/collections/tommy-hilfiger/products.json",
    "https://jaiswalopticals.com/collections/versace/products.json",
    "https://jaiswalopticals.com/collections/vogue-1/products.json",
    "https://jaiswalopticals.com/collections/prada/products.json",
    "https://jaiswalopticals.com/collections/burberry/products.json",
    "https://jaiswalopticals.com/collections/calvin-klein/products.json",
    "https://jaiswalopticals.com/collections/boss-1/products.json",
    "https://jaiswalopticals.com/collections/carrera/products.json",
    "https://jaiswalopticals.com/collections/coach/products.json",
    "https://jaiswalopticals.com/collections/miu-miu/products.json",
    "https://jaiswalopticals.com/collections/swarovski/products.json",
    "https://jaiswalopticals.com/collections/tiffany-co-1/products.json",
    "https://jaiswalopticals.com/collections/silhouette/products.json",
]

LENS_BRANDS = [
    "https://jaiswalopticals.com/collections/zeiss-lenses-1/products.json",
    "https://jaiswalopticals.com/collections/essilor-lenses-1/products.json",
    "https://jaiswalopticals.com/collections/nikon-lenses-1/products.json",
]

ALL_COLLECTION_URLS = FRAME_BRANDS + LENS_BRANDS

# Custom Brand display name overrides
BRAND_DISPLAY_NAMES = {
    "gucci": "Gucci",
    "lacoste-1": "Lacoste",
    "marc-jacob-1": "Marc Jacobs",
    "maui-jim-1": "Maui Jim",
    "mont-blanc-1": "Montblanc",
    "michael-kors": "Michael Kors",
    "oakley": "Oakley",
    "off-white-1": "Off-White",
    "persol": "Persol",
    "polaroid": "Polaroid",
    "police": "Police",
    "philippe-v-1": "Philippe V",
    "philipp-plein-1": "Philipp Plein",
    "ralph-lauren": "Ralph Lauren",
    "rayban": "Ray-Ban",
    "rayban-meta": "Ray-Ban Meta",
    "rayban-meta-gen-2": "Ray-Ban Meta Gen 2",
    "salvatore-ferragamo": "Salvatore Ferragamo",
    "stepper": "Stepper",
    "saint-laurent-1": "Saint Laurent",
    "tom-ford": "Tom Ford",
    "tommy-hilfiger": "Tommy Hilfiger",
    "versace": "Versace",
    "vogue-1": "Vogue",
    "prada": "Prada",
    "burberry": "Burberry",
    "calvin-klein": "Calvin Klein",
    "boss-1": "Boss",
    "carrera": "Carrera",
    "coach": "Coach",
    "miu-miu": "Miu Miu",
    "swarovski": "Swarovski",
    "tiffany-co-1": "Tiffany & Co.",
    "silhouette": "Silhouette",
    "zeiss-lenses-1": "Zeiss",
    "essilor-lenses-1": "Essilor",
    "nikon-lenses-1": "Nikon",
    "bausch-lomb-1": "Bausch & Lomb",
    "alcon-1": "Alcon",
    "johnson-johnson-1": "Johnson & Johnson",
}

def extract_slug(url: str) -> str:
    match = re.search(r'/collections/([^/]+)/products\.json', url)
    if match:
        return match.group(1)
    return url.split('/collections/')[-1].replace('/products.json', '')

def get_brand_name(slug: str) -> str:
    if slug in BRAND_DISPLAY_NAMES:
        return BRAND_DISPLAY_NAMES[slug]
    clean_slug = re.sub(r'-\d+$', '', slug)
    return clean_slug.replace('-', ' ').title()

def sanitize_filename(name: str) -> str:
    if not name:
        return ""
    sanitized = re.sub(r'[\\/*?:"<>|]', '_', name)
    return sanitized.strip()

def download_single_image(image_url: str, filename: str, output_dir: str):
    if not image_url:
        return
    file_path = os.path.join(output_dir, filename)

    if os.path.exists(file_path):
        return

    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        response = requests.get(image_url, headers=headers, timeout=15)
        if response.status_code == 200:
            with open(file_path, "wb") as f:
                f.write(response.content)
    except Exception:
        pass

def main():
    images_dir = "images"
    os.makedirs(images_dir, exist_ok=True)
    
    csv_file = "products.csv"
    headers = [
        "Product Title",
        "Brand",
        "Price",
        "Compare At Price",
        "Product URL",
        "First Image URL",
        "All Image URLs",
        "Variant Titles",
        "Product Type",
        "SKU",
        "Available Stock"
    ]

    seen_product_ids = set()
    brand_counts = {}

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })

    with open(csv_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)

        print("Starting product scraper for Jaiswal Opticals...")

        with ThreadPoolExecutor(max_workers=20) as executor:
            for collection_url in ALL_COLLECTION_URLS:
                slug = extract_slug(collection_url)
                brand_name = get_brand_name(slug)
                brand_counts[brand_name] = brand_counts.get(brand_name, 0)
                brand_scraped_so_far = 0

                page = 1
                while True:
                    api_url = f"https://jaiswalopticals.com/collections/{slug}/products.json?limit=250&page={page}"
                    
                    try:
                        res = session.get(api_url, timeout=15)
                        time.sleep(1)  # 1 second delay between API requests as per requirements
                        
                        if res.status_code != 200:
                            print(f"  [Warning] HTTP {res.status_code} for {api_url}, skipping page.")
                            break

                        data = res.json()
                        products = data.get("products", [])

                        if not products:
                            break

                        for product in products:
                            product_id = product.get("id")
                            if product_id in seen_product_ids:
                                continue
                            seen_product_ids.add(product_id)

                            title = product.get("title", "").strip()
                            handle = product.get("handle", "").strip()
                            product_url = f"https://jaiswalopticals.com/products/{handle}"
                            product_type = product.get("product_type", "").strip()

                            # Image URLs (extract all product images)
                            images = product.get("images", [])
                            all_image_urls = [img.get("src", "") for img in images if img.get("src")]
                            first_image_url = all_image_urls[0] if all_image_urls else ""
                            all_image_urls_str = ", ".join(all_image_urls)

                            # Variants
                            variants = product.get("variants", [])
                            variant_titles = ", ".join([v.get("title", "").strip() for v in variants if v.get("title")])

                            first_variant = variants[0] if variants else {}
                            price = first_variant.get("price", "")
                            compare_at_price = first_variant.get("compare_at_price", "") or ""
                            sku = first_variant.get("sku", "").strip() if first_variant.get("sku") else ""
                            available_stock = any(v.get("available", False) for v in variants)

                            # Queue concurrent image downloads for ALL product images
                            safe_sku = sanitize_filename(sku).strip() or "NOSKU"
                            safe_handle = sanitize_filename(handle).strip()

                            for idx, img_url in enumerate(all_image_urls, start=1):
                                if len(all_image_urls) == 1:
                                    img_filename = f"{safe_sku}_{safe_handle}.jpg"
                                else:
                                    img_filename = f"{safe_sku}_{safe_handle}_{idx}.jpg"
                                executor.submit(download_single_image, img_url, img_filename, images_dir)

                            writer.writerow([
                                title,
                                brand_name,
                                price,
                                compare_at_price,
                                product_url,
                                first_image_url,
                                all_image_urls_str,
                                variant_titles,
                                product_type,
                                sku,
                                str(available_stock).lower()
                            ])

                            brand_scraped_so_far += 1
                            brand_counts[brand_name] += 1

                        print(f"Scraping {brand_name} — Page {page} — {brand_scraped_so_far} products so far")
                        page += 1

                    except Exception as e:
                        print(f"  [Error] Failed scraping {api_url}: {e}")
                        break

            print("\nFinalizing image downloads...")

    print("\n" + "=" * 50)
    print("SCRAPING SUMMARY (Total Products Scraped per Brand):")
    print("=" * 50)
    for brand, count in brand_counts.items():
        print(f"  - {brand}: {count} products")
    print("-" * 50)
    print(f"Total Unique Products Scraped: {len(seen_product_ids)}")
    print(f"Data saved to: {csv_file}")
    print(f"Images downloaded to: /{images_dir}")

if __name__ == "__main__":
    main()
