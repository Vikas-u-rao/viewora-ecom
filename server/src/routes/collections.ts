import { Router } from 'express';
import { getCollections } from '../controllers/collections';

const router = Router();

router.get('/', getCollections);

export default router;
