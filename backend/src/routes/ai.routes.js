import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDashboard } from '../controllers/ai.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/dashboard', getDashboard);

export default router;
