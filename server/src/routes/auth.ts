import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);

export default router;

