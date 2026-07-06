import { API_BASE } from '@/context/AuthContext';

// ── Types ───────────────────────────────────────────────────────────────────

export interface CartVariant {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  lensType: string | null;
  material: string | null;
  price: string; // Decimal comes as string from Prisma
  stock: number;
  imageUrls: string[];
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string | null;
  };
}

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  productUnavailable: boolean;
  variant: CartVariant | null;
}

export interface MergeResult {
  message: string;
  skippedItems: Array<{
    variantId: string | null;
    reason: string;
  }>;
}

// ── Error helper ────────────────────────────────────────────────────────────

class CartApiError extends Error {
  code: string;
  statusCode: number;
  details: object[];

  constructor(code: string, statusCode: number, message: string, details: object[] = []) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'CartApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const err = data?.error || {};
    throw new CartApiError(
      err.code || 'UNKNOWN_ERROR',
      res.status,
      err.message || 'An unexpected error occurred',
      err.details || [],
    );
  }
  return data as T;
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ── API Functions ───────────────────────────────────────────────────────────

export async function fetchCart(token: string): Promise<CartItem[]> {
  const res = await fetch(`${API_BASE}/cart`, {
    headers: authHeaders(token),
    credentials: 'include',
  });
  return handleResponse<CartItem[]>(res);
}

export async function addToCartApi(
  token: string,
  variantId: string,
  quantity: number = 1,
): Promise<{ id: string; variantId: string; quantity: number }> {
  const res = await fetch(`${API_BASE}/cart`, {
    method: 'POST',
    headers: authHeaders(token),
    credentials: 'include',
    body: JSON.stringify({ variantId, quantity }),
  });
  return handleResponse(res);
}

export async function updateCartItemApi(
  token: string,
  itemId: string,
  quantity: number,
): Promise<{ id: string; variantId: string; quantity: number }> {
  const res = await fetch(`${API_BASE}/cart/${itemId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    credentials: 'include',
    body: JSON.stringify({ quantity }),
  });
  return handleResponse(res);
}

export async function removeCartItemApi(
  token: string,
  itemId: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/cart/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function mergeCartApi(
  token: string,
  items: Array<{ variantId: string; quantity: number }>,
): Promise<MergeResult> {
  const res = await fetch(`${API_BASE}/cart/merge`, {
    method: 'POST',
    headers: authHeaders(token),
    credentials: 'include',
    body: JSON.stringify({ items }),
  });
  return handleResponse<MergeResult>(res);
}
