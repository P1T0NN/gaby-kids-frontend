// HELPERS
import { createProductOptionIndex } from '../../productOptionIndex/helpers/createProductOptionIndex.js';

// MIGRATIONS
import { migrations } from '../../../migrations/migrations.js';

// UTILS
import { normalizeProductOptionText } from '../../../../shared/features/productVariants/utils/normalizeProductOptionText.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { ProductVariantOption } from '../../../../shared/features/productVariants/types/productVariantTypes.js';

const SIZE_OPTION_NAME = 'size';
const LEGACY_SIZE_VALUE = '6m';
const NEW_SIZE_VALUE = '0';

/** Matches the legacy Size `6M` value regardless of casing or spacing. */
function isLegacySizeOption(option: ProductVariantOption): boolean {
	return (
		normalizeProductOptionText(option.name) === SIZE_OPTION_NAME &&
		normalizeProductOptionText(option.value) === LEGACY_SIZE_VALUE
	);
}

/**
 * Rewrites the legacy Size `6M` value to `0` and rebuilds the affected
 * product's option index so the shop Size filter matches it. Idempotent:
 * the option index rebuild also drops the stale `size:6m` selection keys.
 */
export const backfillSixMonthsSizeToZero = migrations.define({
	table: 'productVariants',
	migrateOne: async (ctx, productVariant) => {
		if (!productVariant.options.some(isLegacySizeOption)) return;

		await ctx.db.patch(productVariant._id, {
			options: productVariant.options.map((option) =>
				isLegacySizeOption(option) ? { ...option, value: NEW_SIZE_VALUE } : option
			)
		});

		const product = await ctx.db.get(productVariant.productId);
		if (!product) return;

		const variants: Doc<'productVariants'>[] = [];
		for await (const variant of ctx.db
			.query('productVariants')
			.withIndex('by_product_id', (query) => query.eq('productId', productVariant.productId))) {
			variants.push(variant);
		}

		await createProductOptionIndex({ ctx, product, variants });
	}
});
