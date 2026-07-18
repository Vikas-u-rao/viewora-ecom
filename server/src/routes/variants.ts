import { Router } from 'express';
import { updateVariant, deleteVariant } from '../controllers/products';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateBody, updateVariantSchema } from '../middleware/validation';

const router = Router();

router.put('/:id', authenticate, requireAdmin, validateBody(updateVariantSchema), updateVariant);
router.delete('/:id', authenticate, requireAdmin, deleteVariant);

export default router;
