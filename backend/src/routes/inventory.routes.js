import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from '../controllers/inventory.controller.js';

const router = Router();

router.use(requireAuth); // every route below requires a valid JWT

router.get('/', listIngredients);
router.post('/', createIngredient);
router.put('/:id', updateIngredient);
router.delete('/:id', deleteIngredient);

export default router;
