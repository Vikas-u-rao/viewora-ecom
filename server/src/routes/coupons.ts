import { Router } from 'express';
import { validateCoupon } from '../controllers/coupons';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/validate', optionalAuth, validateCoupon);

export default router;
