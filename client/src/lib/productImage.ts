const R2_CDN =
  process.env.NEXT_PUBLIC_R2_CDN_URL ||
  "https://cdn.viewora.in";

/**
 * Rewrites a product image URL:
 * - If it's already an absolute https:// URL that is NOT localhost, returns as-is (rewriting old R2 dev domain to cdn.viewora.in).
 * - If it's a localhost URL (e.g. http://localhost:5000/uploads/...), rewrites to R2 CDN.
 * - If it's a relative /uploads/... path, rewrites to R2 CDN.
 * - If null/undefined, returns null.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Already a valid public R2 / external HTTPS URL (and not localhost)
  if (trimmed.startsWith("https://") && !trimmed.includes("localhost")) {
    if (trimmed.includes("cdn.shopify.com/s/files/1/0694/2051/5411/files/")) {
      return trimmed.replace("https://cdn.shopify.com/s/files/1/0694/2051/5411/files/", "https://cdn.viewora.in/uploads/products/");
    }
    if (trimmed.includes("pub-6bbb8cfdaf924bbbb21aaeeaed84a66e.r2.dev")) {
      return trimmed.replace("pub-6bbb8cfdaf924bbbb21aaeeaed84a66e.r2.dev", "cdn.viewora.in");
    }
    return trimmed;
  }

  // Extract the filename from relative, leading slash, or localhost paths
  const cleanFilename = trimmed.replace(/^(https?:\/\/[^\/]+)?\/?(uploads\/products\/)?/, "");
  if (cleanFilename) {
    return `${R2_CDN}/uploads/products/${cleanFilename}`;
  }

  return trimmed;
}

/**
 * Helper function to safely extract display images for a product and selected variant:
 * - Checks variant.imageUrls first.
 * - Falls back to product.defaultImageUrls if variant array is empty.
 * - Deduplicates resolved URLs.
 */
export function getDisplayImages(
  product?: { defaultImageUrls?: string[] | null } | null,
  selectedVariant?: { imageUrls?: string[] | null } | null
): string[] {
  const urls: string[] = [];

  if (selectedVariant?.imageUrls && Array.isArray(selectedVariant.imageUrls)) {
    selectedVariant.imageUrls.forEach((u) => {
      const res = resolveImageUrl(u);
      if (res && !urls.includes(res)) urls.push(res);
    });
  }

  if (product?.defaultImageUrls && Array.isArray(product.defaultImageUrls)) {
    product.defaultImageUrls.forEach((u) => {
      const res = resolveImageUrl(u);
      if (res && !urls.includes(res)) urls.push(res);
    });
  }

  return urls;
}

