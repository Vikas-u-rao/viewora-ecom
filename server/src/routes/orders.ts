import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createOrder, listOrders, getOrderDetails, cancelOrder } from '../controllers/orders';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

const orderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many order attempts. Please wait a few minutes before trying again.', details: [] } },
  validate: { trustProxy: false, xForwardedForHeader: false },
});

router.post('/', orderCreationLimiter, optionalAuth, createOrder);
router.get('/', authenticate, listOrders);
router.get('/:id', optionalAuth, getOrderDetails);
router.post('/:id/cancel', optionalAuth, cancelOrder);

export default router;
