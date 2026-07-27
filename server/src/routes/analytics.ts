import { Router } from 'express';
import { trackPageView, getHeatmapAnalytics } from '../controllers/analytics';

const router = Router();

router.post('/track', trackPageView);
router.get('/heatmap', getHeatmapAnalytics);

export default router;
