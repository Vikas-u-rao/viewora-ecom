import { Router } from 'express';
import {
  getEditorialCollections,
  getEditorialCollectionBySlug,
  adminGetEditorialCollections,
  adminCreateEditorialCollection,
  adminUpdateEditorialCollection,
  adminDeleteEditorialCollection,
} from '../controllers/editorial';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Admin routes (MUST come before /:slug to prevent "admin" being matched as a slug)
router.get('/admin/list', authenticate, requireAdmin, adminGetEditorialCollections);
router.post('/admin', authenticate, requireAdmin, adminCreateEditorialCollection);
router.put('/admin/:id', authenticate, requireAdmin, adminUpdateEditorialCollection);
router.delete('/admin/:id', authenticate, requireAdmin, adminDeleteEditorialCollection);

// Public routes
router.get('/', getEditorialCollections);
router.get('/:slug', getEditorialCollectionBySlug);

export default router;
