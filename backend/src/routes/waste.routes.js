import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listWaste, createWaste } from '../controllers/waste.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listWaste);
router.post('/', createWaste);

export default router;
