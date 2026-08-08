import { Router } from 'express';
import multer from 'multer';
import {
  listAllOrders,
  updateFulfillmentStatus,
  initiateRefund,
  listAllProducts,
  createProduct,
  deleteProduct,
  uploadProductImage,
  listAllCoupons,
  createCoupon,
  deleteCoupon,
  listAdminActivity,
  getAdminNotifications,
  updateVariantStock,
} from '../controllers/admin';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Apply auth + admin middleware to remaining admin routes
router.use(authenticate, requireAdmin);

router.get('/orders', listAllOrders);
router.put('/orders/:id/fulfillment-status', updateFulfillmentStatus);
router.post('/orders/:id/refund', initiateRefund);
router.get('/products', listAllProducts);
router.post('/products', createProduct);
router.delete('/products/:id', deleteProduct);
router.post('/upload', upload.single('image'), uploadProductImage);
router.get('/coupons', listAllCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.get('/activity', listAdminActivity);
router.get('/notifications', getAdminNotifications);
router.put('/variants/:id/stock', updateVariantStock);

export default router;
