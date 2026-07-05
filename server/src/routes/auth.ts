import { Router } from 'express';
import { register, login, refresh, logout, logoutAll } from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import { validateBody, registerSchema, loginSchema } from '../middleware/validation';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);

export default router;

