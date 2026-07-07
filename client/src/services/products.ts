import { API_BASE } from "@/context/AuthContext";
import type { CartVariant } from "@/services/cart";

export interface ProductVariant extends Omit<CartVariant, "product"> {
  isActive: boolean;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  description?: string | null;
  defaultImageUrls: string[];
  startingPrice: string;
  variants: ProductVariant[];
}

export async function fetchProductsApi(query = "") {
  const res = await fetch(`${API_BASE}/products${query}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Failed to load products");
  }
  return data as { products: ApiProduct[]; total: number; page: number; pages: number };
}

export function variantSnapshot(product: ApiProduct, variant: ProductVariant): CartVariant {
  return {
    id: variant.id,
    sku: variant.sku,
    color: variant.color,
    size: variant.size,
    lensType: variant.lensType,
    material: variant.material,
    price: String(variant.price),
    stock: variant.stock,
    imageUrls: variant.imageUrls?.length ? variant.imageUrls : product.defaultImageUrls,
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand || null,
    },
  };
}
