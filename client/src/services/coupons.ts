import { API_BASE } from "@/context/AuthContext";

interface CouponValidationResult {
  valid: boolean;
  coupon: {
    id: string;
    code: string;
    value: string;
    expiresAt: string;
  };
}

export async function validateCouponApi(code: string, token?: string | null, guestEmail?: string, guestPhone?: string): Promise<CouponValidationResult> {
  const res = await fetch(`${API_BASE}/coupons/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ code, guestEmail, guestPhone }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || "Coupon validation failed");
  }
  return data;
}

export const COUPON_STORAGE_KEY = "viewora_applied_coupon";
