import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listProduction, createProduction } from '../controllers/production.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listProduction);
router.post('/', createProduction);

export default router;
