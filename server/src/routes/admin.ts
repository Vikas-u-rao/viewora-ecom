import { Router } from 'express';
import { listAllOrders, updateFulfillmentStatus, initiateRefund, listAllProducts, listAllCoupons, createCoupon, deleteCoupon } from '../controllers/admin';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Apply auth + admin middleware to all admin routes
router.use(authenticate, requireAdmin);

router.get('/orders', listAllOrders);
router.put('/orders/:id/fulfillment-status', updateFulfillmentStatus);
router.post('/orders/:id/refund', initiateRefund);
router.get('/products', listAllProducts);
router.get('/coupons', listAllCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:id', deleteCoupon);

export default router;
