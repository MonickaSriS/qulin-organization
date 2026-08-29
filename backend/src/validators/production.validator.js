import { z } from 'zod';

export const createProductionSchema = z.object({
  item: z.string().min(1, 'Item is required'),
  meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  date: z.coerce.date(),
  preparedQty: z.number().nonnegative('Prepared quantity cannot be negative'),
});
