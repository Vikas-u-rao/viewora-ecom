import Razorpay from 'razorpay';
import { logger } from './logger';

/**
 * Shared Razorpay configuration.
 * Import from here rather than re-reading env vars in every controller.
 */

function requiredEnv(name: string): string {
  const val = process.env[name];
  if (!val || val === 'YOUR_VALUE_HERE') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required Razorpay env var: ${name}`);
    }
    return '';
  }
  return val;
}

export const razorpayKeyId = requiredEnv('RAZORPAY_KEY_ID');
export const razorpayKeySecret = requiredEnv('RAZORPAY_KEY_SECRET');

if (process.env.NODE_ENV === 'production' && razorpayKeyId?.startsWith('rzp_test_')) {
  throw new Error('Razorpay test key detected in production environment');
}

let razorpayClient: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!razorpayClient) {
    const keyId = process.env.RAZORPAY_KEY_ID || razorpayKeyId;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || razorpayKeySecret;

    if (!keyId || !keySecret) {
      logger.warn({ msg: 'Razorpay keys not configured' });
    }

    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayClient;
}
