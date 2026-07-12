import { API_BASE } from "@/context/AuthContext";
import type { CartItem } from "@/services/cart";

export interface OrderItem {
  id: string;
  skuSnapshot: string;
  quantity: number;
  priceAtPurchase: string;
  variant: {
    id: string;
    sku: string;
    color?: string | null;
    size?: string | null;
    lensType?: string | null;
    material?: string | null;
    imageUrls: string[];
    product: {
      id: string;
      name: string;
      slug: string;
      brand?: string | null;
      defaultImageUrls?: string[];
    };
  };
}

export interface Order {
  id: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
  shippingName?: string | null;
  shippingLine1?: string | null;
  shippingLine2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPincode?: string | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotal: string;
  shippingFee: string;
  finalPayableAmount: string;
  createdAt: string;
  items: OrderItem[];
  payment?: {
    status: string;
    merchantTransactionId: string;
  } | null;
  earnedCoupon?: {
    code: string;
    value: string;
    expiresAt: string;
  } | null;
}

export interface CreateOrderPayload {
  addressId?: string;
  shippingName?: string;
  shippingLine1?: string;
  shippingLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPincode?: string;
  guestEmail?: string;
  guestPhone?: string;
  paymentMethod?: string;
  couponCode?: string;
  items: Array<{ variantId: string; quantity: number }>;
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || "Request failed");
  }
  return data as T;
}

export function orderItemsFromCart(items: CartItem[]) {
  return items
    .filter((item) => !item.productUnavailable && item.variant)
    .map((item) => ({ variantId: item.variantId, quantity: item.quantity }));
}

export async function createOrderApi(payload: CreateOrderPayload, token?: string | null) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return parseJson<{ order: Order }>(res);
}

export async function fetchOrdersApi(token: string) {
  const res = await fetch(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  return parseJson<{ orders: Order[] }>(res);
}

export async function fetchOrderApi(id: string, token?: string | null) {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  return parseJson<{ order: Order }>(res);
}

export async function initiatePaymentApi(orderId: string, token?: string | null) {
  const res = await fetch(`${API_BASE}/payments/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ orderId }),
  });
  return parseJson<{ success: boolean; redirectUrl: string }>(res);
}

export async function getPaymentStatusApi(orderId: string, token?: string | null) {
  const res = await fetch(`${API_BASE}/payments/status/${orderId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  return parseJson<{ paymentStatus: string; status: string }>(res);
}

