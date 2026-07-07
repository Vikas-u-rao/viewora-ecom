import { Router } from 'express';
import { listAllOrders, updateFulfillmentStatus, initiateRefund, listAllProducts } from '../controllers/admin';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Apply auth + admin middleware to all admin routes
router.use(authenticate, requireAdmin);

router.get('/orders', listAllOrders);
router.put('/orders/:id/fulfillment-status', updateFulfillmentStatus);
router.post('/orders/:id/refund', initiateRefund);
router.get('/products', listAllProducts);

export default router;
