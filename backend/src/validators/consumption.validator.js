import { z } from 'zod';

export const createConsumptionSchema = z.object({
  item: z.string().min(1, 'Item is required'),
  meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  date: z.coerce.date(),
  consumedQty: z.number().nonnegative('Consumed quantity cannot be negative'),
  customerCount: z.number().nonnegative().optional(),
});
