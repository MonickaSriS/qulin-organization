import Ingredient from '../models/Ingredient.js';
import { createIngredientSchema, updateIngredientSchema } from '../validators/inventory.validator.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/v1/inventory?branchId=...
export const listIngredients = asyncHandler(async (req, res) => {
  const filter = { orgId: req.user.orgId };
  if (req.query.branchId) filter.branchId = req.query.branchId;

  const ingredients = await Ingredient.find(filter).sort({ name: 1 });
  res.status(200).json(ingredients);
});

// POST /api/v1/inventory
export const createIngredient = asyncHandler(async (req, res) => {
  const data = createIngredientSchema.parse(req.body);

  if (!req.user.branchId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'User is not assigned to a branch');
  }

  const ingredient = await Ingredient.create({
    ...data,
    orgId: req.user.orgId,
    branchId: req.user.branchId,
  });
  res.status(201).json(ingredient);
});

// PUT /api/v1/inventory/:id
export const updateIngredient = asyncHandler(async (req, res) => {
  const data = updateIngredientSchema.parse(req.body);

  const ingredient = await Ingredient.findOneAndUpdate(
    { _id: req.params.id, orgId: req.user.orgId }, // org-scoped — can't touch another org's data
    data,
    { new: true, runValidators: true }
  );

  if (!ingredient) {
    throw new AppError(404, 'NOT_FOUND', 'Ingredient not found');
  }
  res.status(200).json(ingredient);
});

// DELETE /api/v1/inventory/:id
export const deleteIngredient = asyncHandler(async (req, res) => {
  const result = await Ingredient.findOneAndDelete({
    _id: req.params.id,
    orgId: req.user.orgId,
  });

  if (!result) {
    throw new AppError(404, 'NOT_FOUND', 'Ingredient not found');
  }
  res.status(200).json({ success: true });
});
