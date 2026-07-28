import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.png";
import p4 from "@/assets/p4.png";
import type { StaticImageData } from "next/image";

const fallbackImages: StaticImageData[] = [p1, p2, p3, p4];

const R2_CDN = "https://pub-6bbb8cfdaf924bbbb21aaeeaed84a66e.r2.dev";

/**
 * Rewrites a product image URL:
 * - If it's already an absolute https:// URL that is NOT localhost, returns as-is.
 * - If it's a localhost URL (e.g. http://localhost:5000/uploads/...), rewrites to R2 CDN.
 * - If it's a relative /uploads/... path, rewrites to R2 CDN.
 * - If null/undefined, returns null.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Already a valid public URL (R2, azurewebsites, etc.)
  if (url.startsWith("https://") && !url.includes("localhost")) return url;
  // Relative or localhost upload path — extract the filename and rewrite to R2
  const match = url.match(/\/uploads\/products\/([^?#]+)/);
  if (match) {
    return `${R2_CDN}/uploads/products/${match[1]}`;
  }
  // Fallback: return as-is (may still be a relative path)
  return url;
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
