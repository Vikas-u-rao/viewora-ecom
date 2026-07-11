import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { initiatePayment, paymentCallback, getPaymentStatus } from '../controllers/payments';

const router = Router();

// PhonePe payment flow
router.post('/initiate', optionalAuth, initiatePayment);
router.post('/callback', paymentCallback);
router.get('/status/:orderId', optionalAuth, getPaymentStatus);

export default router;

// ── Re-export for tests ──
export { calculateCheckoutTotals } from '../lib/phonepe';
