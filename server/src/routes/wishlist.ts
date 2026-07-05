import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlist';
import { authenticate } from '../middleware/auth';

const router = Router();

// All wishlist routes require user authentication
router.get('/', authenticate, getWishlist);
router.post('/', authenticate, addToWishlist);
router.delete('/:itemId', authenticate, removeFromWishlist);

export default router;
