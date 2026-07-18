/**
 * Server-side business constants.
 * Import from here rather than scattering magic numbers across controllers.
 *
 * When business rules change (e.g., raise shipping fee to ₹149), update ONLY here.
 */

// ── Shipping ─────────────────────────────────────────────────────────────────
export const SHIPPING_FEE_INR = 99;
export const FREE_SHIPPING_THRESHOLD_INR = 999; // orders above this get free shipping (future use)

// ── OTP ──────────────────────────────────────────────────────────────────────
export const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
export const OTP_LENGTH = 6;
export const MAX_OTP_ATTEMPTS = 5; // lock OTP after this many failed verifications

// ── Stock Reservation ────────────────────────────────────────────────────────
/** Time window in ms during which stock is held while user completes payment */
export const STOCK_RESERVATION_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// ── Pagination ───────────────────────────────────────────────────────────────
export const ADMIN_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 100;

// ── Passwords ────────────────────────────────────────────────────────────────
export const BCRYPT_ROUNDS = 12;

// ── Coupon / Referral ────────────────────────────────────────────────────────
export const REFERRAL_DISCOUNT_INR = 100;
export const DEFAULT_COUPON_EXPIRY_DAYS = 30;
