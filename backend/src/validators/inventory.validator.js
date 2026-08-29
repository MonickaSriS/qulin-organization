import { z } from 'zod';

export const createIngredientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  unit: z.enum(['kg', 'g', 'l', 'ml', 'unit']),
  currentStock: z.number().nonnegative('Stock cannot be negative'),
  costPerUnit: z.number().nonnegative('Cost cannot be negative'),
  purchaseDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
});

// All fields optional for updates — but if provided, must still be valid
export const updateIngredientSchema = createIngredientSchema.partial();
