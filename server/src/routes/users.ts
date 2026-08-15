import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  requestEmailChange,
  verifyEmailChange,
  deleteAccount,
} from '../controllers/users';
import { getMyCoupons, getMyReferrals } from '../controllers/coupons';
import { authenticate } from '../middleware/auth';
import { validateBody, updateProfileSchema, addressSchema } from '../middleware/validation';

const router = Router();

// Secure all user profile and address routes
router.use(authenticate);

router.get('/me', getProfile);
router.patch('/me', validateBody(updateProfileSchema), updateProfile);
router.delete('/me', deleteAccount);

router.post('/me/email-change/request', requestEmailChange);
router.post('/me/email-change/verify', verifyEmailChange);

router.get('/me/addresses', getAddresses);
router.post('/me/addresses', validateBody(addressSchema), addAddress);
router.put('/me/addresses/:id', validateBody(addressSchema), updateAddress);
router.delete('/me/addresses/:id', deleteAddress);

router.get('/me/coupons', getMyCoupons);
router.get('/me/referrals', getMyReferrals);

export default router;

