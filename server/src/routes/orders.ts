import { Router } from 'express';
import { createOrder, listOrders, getOrderDetails, cancelOrder } from '../controllers/orders';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/', optionalAuth, createOrder);
router.get('/', authenticate, listOrders);
router.get('/:id', optionalAuth, getOrderDetails);
router.post('/:id/cancel', optionalAuth, cancelOrder);

export default router;
