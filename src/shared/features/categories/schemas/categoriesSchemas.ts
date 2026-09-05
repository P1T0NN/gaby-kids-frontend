// LIBRARIES
import { z } from 'zod';

// CONFIG
import { CATEGORY_CONFIG } from '../config.js';

// TYPES
import type { Id } from '../../../../convex/_generated/dataModel.js';

export const createCategorySchema = z.object({
	name: z.string().trim().min(1).max(CATEGORY_CONFIG.maxNameLength),
	status: z.enum(['active', 'archived'])
});

export const updateCategorySchema = createCategorySchema.extend({
	id: z
		.string()
		.min(1)
		.transform((value) => {
			// SAFETY: Convex's v.id('categories') validator remains authoritative at the mutation boundary.
			return value as Id<'categories'>;
		})
});
