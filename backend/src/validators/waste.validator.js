import { z } from 'zod';

export const createWasteSchema = z.object({
  item: z.string().min(1, 'Item is required'),
  date: z.coerce.date(),
  wasteQty: z.number().positive('Waste quantity must be greater than zero'),
  reason: z.enum(['overproduction', 'spoilage', 'preparation', 'plate_waste', 'damaged']),
});
