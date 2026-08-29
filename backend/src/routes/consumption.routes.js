import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listConsumption, createConsumption } from '../controllers/consumption.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listConsumption);
router.post('/', createConsumption);

export default router;
