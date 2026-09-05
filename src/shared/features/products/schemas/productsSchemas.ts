import { z } from 'zod';

// TYPES
import type { Id } from '../../../../convex/_generated/dataModel.js';

export const saveProductSchema = z.object({
	id: z
		.string()
		.min(1)
		.transform((value) => {
			// SAFETY: Convex validates the table ID at the mutation boundary.
			return value as Id<'products'>;
		})
		.optional(),
	status: z.enum(['draft', 'active', 'archived']).optional(),
	name: z.string().trim().min(1).max(255),
	description: z.string().trim().min(1).max(5_000),
	priceInCents: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
	categoryId: z
		.string()
		.trim()
		.min(1)
		.transform((value) => {
			// SAFETY: Convex's v.id('categories') validator remains authoritative at the mutation boundary.
			return value as Id<'categories'>;
		})
});
