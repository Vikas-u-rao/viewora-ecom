import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import {
  initiatePayment,
  paymentCallback,
  getPaymentStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhookHandler,
} from '../controllers/payments';

const router = Router();

// PhonePe payment flow
router.post('/initiate', optionalAuth, initiatePayment);
router.post('/callback', paymentCallback);
router.get('/status/:orderId', optionalAuth, getPaymentStatus);

// Razorpay payment flow
router.post('/razorpay/create-order', optionalAuth, createRazorpayOrder);
router.post('/razorpay/verify', optionalAuth, verifyRazorpayPayment);
router.post('/razorpay/webhook', razorpayWebhookHandler);

export default router;


// ── Re-export for tests ──
export { calculateCheckoutTotals } from '../lib/phonepe';
