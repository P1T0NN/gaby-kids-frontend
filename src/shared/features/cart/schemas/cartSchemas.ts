// LIBRARIES
import { z } from 'zod';

export const storedCartSchema = z.array(
	z.union([
		z.object({
			id: z.string().trim().min(1),
			image: z.string(),
			quantity: z.number().int().min(1)
		}),
		z
			.object({
				id: z.string().trim().min(1),
				images: z.array(z.string()),
				quantity: z.number().int().min(1)
			})
			.transform(({ images, ...item }) => ({ ...item, image: images[0] ?? '' }))
	])
);
