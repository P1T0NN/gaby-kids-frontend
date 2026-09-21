import { z } from 'zod';

// CONFIG
import { DEFAULT_PRODUCT_AGE_GROUP, DEFAULT_PRODUCT_GENDER } from '../config.js';
import { PRODUCT_VARIANTS_CONFIG } from '../../productVariants/config.js';

// ATTRIBUTES
import { PRODUCT_AGE_GROUPS, PRODUCT_GENDERS } from '../data/productsData.js';

// SCHEMAS
import { productVariantSchema } from '../../productVariants/schemas/productVariantSchemas.js';

// UTILS
import { getProductVariantOptionKey } from '../../productVariants/utils/getProductVariantOptionKey.js';
import { hasValidProductVariantDiscount } from '../../productVariants/utils/hasValidProductVariantDiscount.js';

// TYPES
import type { Id } from '../../../../convex/_generated/dataModel.js';

export const saveProductSchema = z
	.object({
		id: z
			.string()
			.min(1)
			.transform((value) => {
				// SAFETY: Convex validates the table ID at the mutation boundary.
				return value as Id<'products'>;
			})
			.optional(),
		status: z.enum(['draft', 'active', 'archived']).optional(),
		ageGroup: z.enum(PRODUCT_AGE_GROUPS).default(DEFAULT_PRODUCT_AGE_GROUP),
		gender: z.enum(PRODUCT_GENDERS).default(DEFAULT_PRODUCT_GENDER),
		name: z.string().trim().min(1).max(255),
		description: z.string().trim().min(1).max(5_000),
		trackInventory: z.boolean(),
		categoryId: z
			.string()
			.trim()
			.min(1)
			.transform((value) => {
				// SAFETY: Convex's v.id('categories') validator remains authoritative at the mutation boundary.
				return value as Id<'categories'>;
			}),
		productVariantOptionNames: z
			.array(z.string().trim().min(1).max(PRODUCT_VARIANTS_CONFIG.MAX_OPTION_NAME_LENGTH))
			.max(PRODUCT_VARIANTS_CONFIG.MAX_OPTION_COUNT),
		productVariants: z.array(productVariantSchema)
	})
	.superRefine((value, ctx) => {
		if (value.productVariants.length === 0) {
			ctx.addIssue({
				code: 'custom',
				path: ['productVariants'],
				message: 'INVALID_PRODUCT_VARIANT'
			});
		}

		const productVariantOptionNames = value.productVariantOptionNames.map((name) =>
			name.toLowerCase()
		);
		if (new Set(productVariantOptionNames).size !== productVariantOptionNames.length) {
			ctx.addIssue({
				code: 'custom',
				path: ['productVariantOptionNames'],
				message: 'DUPLICATE_PRODUCT_VARIANT_OPTION'
			});
		}
		if (productVariantOptionNames.length === 0 && value.productVariants.length !== 1) {
			ctx.addIssue({
				code: 'custom',
				path: ['productVariants'],
				message: 'INVALID_PRODUCT_VARIANT'
			});
		}

		const seenCombinations = new Set<string>();
		value.productVariants.forEach((productVariant, index) => {
			if (
				!hasValidProductVariantDiscount(
					productVariant.compareAtPriceInCents,
					productVariant.priceInCents
				)
			) {
				ctx.addIssue({
					code: 'custom',
					path: ['productVariants', index, 'compareAtPriceInCents'],
					message: 'COMPARE_AT_PRICE_MUST_EXCEED_PRICE'
				});
			}

			const optionsMatch =
				productVariant.options.length === productVariantOptionNames.length &&
				productVariant.options.every(
					(option, optionIndex) =>
						option.name.toLowerCase() === productVariantOptionNames[optionIndex]
				);
			if (!optionsMatch) {
				ctx.addIssue({
					code: 'custom',
					path: ['productVariants', index, 'options'],
					message: 'INVALID_PRODUCT_VARIANT'
				});
			}

			const combination = getProductVariantOptionKey(productVariant.options);
			if (seenCombinations.has(combination)) {
				ctx.addIssue({
					code: 'custom',
					path: ['productVariants', index],
					message: 'DUPLICATE_PRODUCT_VARIANT'
				});
			}
			seenCombinations.add(combination);

			if (productVariant.imageKeys.length === 0) {
				ctx.addIssue({
					code: 'custom',
					path: ['productVariants', index, 'imageKeys'],
					message: 'PRODUCT_VARIANT_IMAGE_REQUIRED'
				});
			}
		});
	});
