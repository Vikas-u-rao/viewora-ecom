import { Router } from 'express';
import { trackPageView, getHeatmapAnalytics } from '../controllers/analytics';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/track', trackPageView);
router.get('/heatmap', authenticate, requireAdmin, getHeatmapAnalytics);

export default router;
