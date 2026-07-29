import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.png";
import p4 from "@/assets/p4.png";
import type { StaticImageData } from "next/image";

const fallbackImages: StaticImageData[] = [p1, p2, p3, p4];

const R2_CDN =
  process.env.NEXT_PUBLIC_R2_CDN_URL ||
  "https://pub-6bbb8cfdaf924bbbb21aaeeaed84a66e.r2.dev";

/**
 * Rewrites a product image URL:
 * - If it's already an absolute https:// URL that is NOT localhost, returns as-is.
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
 * Returns a deterministic fallback image for a product based on its slug.
 * Used when a product has no image URL set.
 */
export function getFallbackImage(slug: string): StaticImageData {
  const hash = Array.from(slug || "").reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    0
  );
  return fallbackImages[hash % fallbackImages.length];
}
