/**
 * Client-side business constants.
 * Import from here instead of spreading magic numbers across components.
 * Pipeline auto-deploy verification comment.
 */

// ── Shop / Catalog ───────────────────────────────────────────────────────────
/** Number of products shown per page on the shop listing */
export const ITEMS_PER_PAGE = 12;
/** Number of products fetched from server in a single call (all-at-once client-side filter mode) */
export const PRODUCTS_FETCH_LIMIT = 48;

// ── Checkout / Pricing ───────────────────────────────────────────────────────
export const SHIPPING_FEE_INR = 99;
export const FREE_SHIPPING_THRESHOLD_INR = 999;

// ── Cart ─────────────────────────────────────────────────────────────────────
export const GUEST_CART_STORAGE_KEY = 'viewora_guest_cart';
export const MAX_CART_QUANTITY_PER_ITEM = 10;

// ── UI ───────────────────────────────────────────────────────────────────────
export const TOAST_DURATION_DEFAULT = 4000;
export const TOAST_DURATION_LONG = 6000;

// ── API Configuration ────────────────────────────────────────────────────────
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.origin}/api/v1`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
}

export const API_BASE = typeof window !== 'undefined'
  ? (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      ? `${window.location.origin}/api/v1`
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'))
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1');

