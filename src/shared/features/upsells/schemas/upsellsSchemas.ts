// LIBRARIES
import { z } from 'zod';

// CONFIG
import { UPSELLS_CONFIG } from '../config.js';

// TYPES
import type { Id } from '../../../../convex/_generated/dataModel.js';

const productId = z
	.string()
	.min(1)
	.transform((value) => {
		// SAFETY: Convex validates the product ID at the mutation boundary.
		return value as Id<'products'>;
	});

export const saveProductUpsellsSchema = z.object({
	productId,
	upsellProductIds: z.array(productId).max(UPSELLS_CONFIG.maxProducts)
});
