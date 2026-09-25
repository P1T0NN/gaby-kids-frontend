import { z } from 'zod';

// CONFIG
import { PRODUCT_VARIANTS_CONFIG } from '../config.js';

// TYPES
import type { Id } from '../../../../convex/_generated/dataModel.js';

const productVariantIdSchema = z
	.string()
	.trim()
	.min(1)
	.transform((value) => {
		// SAFETY: Convex's v.id('productVariants') validator remains authoritative at the mutation boundary.
		return value as Id<'productVariants'>;
	});

export const productVariantOptionSchema = z.object({
	name: z.string().trim().min(1).max(PRODUCT_VARIANTS_CONFIG.MAX_OPTION_NAME_LENGTH),
	value: z.string().trim().min(1).max(PRODUCT_VARIANTS_CONFIG.MAX_OPTION_VALUE_LENGTH)
});

export const productVariantSchema = z.object({
	id: productVariantIdSchema.optional(),
	options: z.array(productVariantOptionSchema).max(PRODUCT_VARIANTS_CONFIG.MAX_OPTION_COUNT),
	sku: z.string().trim().max(PRODUCT_VARIANTS_CONFIG.MAX_SKU_LENGTH),
	imageKeys: z.array(z.string().trim().min(1)),
	priceInCents: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
	compareAtPriceInCents: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
	inventory: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
});
