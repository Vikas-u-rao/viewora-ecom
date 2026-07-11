/**
 * Shared PhonePe configuration.
 * Import from here rather than re-reading env vars in every controller.
 *
 * In production, missing credentials cause a loud crash instead of silently
 * falling back to sandbox defaults, preventing accidental misconfiguration.
 */

function requiredEnv(name: string): string {
  const val = process.env[name];
  if (!val || val === 'YOUR_VALUE_HERE') {
    if (process.env.PHONEPE_ENV === 'production' || process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required PhonePe env var: ${name}`);
    }
    return '';
  }
  return val;
}

export const phonepeEnv = process.env.PHONEPE_ENV || 'sandbox';

const rawMerchantId = requiredEnv('PHONEPE_MERCHANT_ID');
export const merchantId = rawMerchantId || 'PGOMT';

const rawSaltKey = requiredEnv('PHONEPE_SALT_KEY');
export const saltKey = rawSaltKey || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';

export const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';

export const baseUrl =
  phonepeEnv === 'production'
    ? process.env.PHONEPE_BASE_URL_PRODUCTION || 'https://api.phonepe.com/apis/hermes'
    : process.env.PHONEPE_BASE_URL_SANDBOX || 'https://api-preprod.phonepe.com/apis/pg-sandbox';

export const redirectUrl =
  process.env.PHONEPE_REDIRECT_URL || 'http://localhost:3000/payment/status';

export const callbackUrl =
  process.env.PHONEPE_CALLBACK_URL || 'http://localhost:5000/api/v1/payments/callback';

export function calculateCheckoutTotals(subtotal: number, itemCount: number, hasItems: boolean) {
  const SHIPPING_FEE = 99;
  const effectiveSubtotal = Number(subtotal) || 0;
  const effectiveItemCount = Number(itemCount) || 0;
  const shippingFee = hasItems && effectiveItemCount > 0 ? SHIPPING_FEE : 0;
  const discountAmount = 0;
  const finalPayableAmount = Math.max(0, effectiveSubtotal + shippingFee - discountAmount);

  return {
    subtotal: effectiveSubtotal,
    shippingFee,
    discountAmount,
    finalPayableAmount,
  };
}
