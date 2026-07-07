import { Router } from 'express';
import { updateVariant, deleteVariant } from '../controllers/products';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.put('/:id', authenticate, requireAdmin, updateVariant);
router.delete('/:id', authenticate, requireAdmin, deleteVariant);

export default router;
