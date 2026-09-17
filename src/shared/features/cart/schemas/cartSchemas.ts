// LIBRARIES
import { z } from 'zod';

export const storedCartSchema = z.array(
	z.object({
		productVariantId: z.string().trim().min(1),
		image: z.string(),
		quantity: z.number().int().min(1)
	})
);
