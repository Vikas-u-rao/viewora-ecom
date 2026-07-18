import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.png";
import p4 from "@/assets/p4.png";
import type { StaticImageData } from "next/image";

const fallbackImages: StaticImageData[] = [p1, p2, p3, p4];

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
