import { Router } from 'express';
import { updateVariant, updateVariantStock, deleteVariant } from '../controllers/products';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateBody, updateVariantSchema, updateVariantStockSchema } from '../middleware/validation';

const router = Router();

router.put('/:id', authenticate, requireAdmin, validateBody(updateVariantSchema), updateVariant);
router.put('/:id/stock', authenticate, requireAdmin, validateBody(updateVariantStockSchema), updateVariantStock);
router.delete('/:id', authenticate, requireAdmin, deleteVariant);

export default router;
