import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/users';
import { authenticate } from '../middleware/auth';
import { validateBody, updateProfileSchema, addressSchema } from '../middleware/validation';

const router = Router();

// Secure all user profile and address routes
router.use(authenticate);

router.get('/me', getProfile);
router.patch('/me', validateBody(updateProfileSchema), updateProfile);

router.get('/me/addresses', getAddresses);
router.post('/me/addresses', validateBody(addressSchema), addAddress);
router.put('/me/addresses/:id', validateBody(addressSchema), updateAddress);
router.delete('/me/addresses/:id', deleteAddress);

export default router;

