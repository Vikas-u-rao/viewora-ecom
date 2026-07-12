import { API_BASE } from '@/context/AuthContext';

// ── Types ───────────────────────────────────────────────────────────────────

export interface WishlistVariant {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  lensType: string | null;
  material: string | null;
  price: string;
  stock: number;
  imageUrls: string[];
  isActive: boolean;
}

export interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  defaultImageUrls: string[];
  startingPrice: string;
  variants: WishlistVariant[];
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: WishlistProduct;
}

// ── Error helper ────────────────────────────────────────────────────────────

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || 'Request failed');
  }
  return data as T;
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ── API Functions ────────────────────────────────────────────────────────────

export async function fetchWishlistApi(token: string): Promise<{ wishlistItems: WishlistItem[] }> {
  const res = await fetch(`${API_BASE}/wishlist`, {
    headers: authHeaders(token),
    credentials: 'include',
  });
  return parseJson<{ wishlistItems: WishlistItem[] }>(res);
}

export async function addToWishlistApi(
  token: string,
  productId: string,
): Promise<{ wishlistItem: WishlistItem }> {
  const res = await fetch(`${API_BASE}/wishlist`, {
    method: 'POST',
    headers: authHeaders(token),
    credentials: 'include',
    body: JSON.stringify({ productId }),
  });
  return parseJson<{ wishlistItem: WishlistItem }>(res);
}

export async function removeFromWishlistApi(
  token: string,
  itemId: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/wishlist/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
    credentials: 'include',
  });
  return parseJson<{ message: string }>(res);
}

export async function checkWishlistApi(
  token: string,
  productId: string,
): Promise<{ wishlisted: boolean; itemId: string | null }> {
  const res = await fetch(`${API_BASE}/wishlist/check/${productId}`, {
    headers: authHeaders(token),
    credentials: 'include',
  });
  return parseJson<{ wishlisted: boolean; itemId: string | null }>(res);
}
