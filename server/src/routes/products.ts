import { Router } from 'express';
import { getProducts, getProductBySlug } from '../controllers/products';

const router = Router();

router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

export default router;
