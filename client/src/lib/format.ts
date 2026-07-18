/**
 * Shared price formatting utility.
 * Single source of truth for INR currency display across the app.
 */
export function formatPrice(value: string | number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}
