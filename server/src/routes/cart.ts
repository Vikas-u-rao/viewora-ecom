import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem, mergeCart } from '../controllers/cart';
import { authenticate } from '../middleware/auth';

const router = Router();

// All cart routes require user authentication
router.get('/', authenticate, getCart);
router.post('/', authenticate, addToCart);
router.put('/:itemId', authenticate, updateCartItem);
router.delete('/:itemId', authenticate, removeCartItem);
router.post('/merge', authenticate, mergeCart);

export default router;
