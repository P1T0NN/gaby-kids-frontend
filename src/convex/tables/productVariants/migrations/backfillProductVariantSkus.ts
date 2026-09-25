// CONFIG
import { PRODUCT_VARIANTS_CONFIG } from '../../../../shared/features/productVariants/config.js';

// UTILS
import { generateSlug } from '../../../../shared/utils/generateSlug.js';
import { getGeneratedProductVariantSku } from '../../../../shared/features/productVariants/utils/getGeneratedProductVariantSku.js';

// MIGRATIONS
import { migrations } from '../../../migrations/migrations.js';

// HELPERS
import { isProductVariantSkuTaken } from '../helpers/isProductVariantSkuTaken.js';

/** The previous slug-based SKU format, kept to recognize untouched automatic SKUs. */
function getLegacyGeneratedProductVariantSku(options: {
	slug: string;
	optionValues: readonly string[];
	position: number;
}): string {
	return (
		generateSlug(`${options.slug} ${options.optionValues.join(' ')}`)
			.slice(0, PRODUCT_VARIANTS_CONFIG.MAX_SKU_LENGTH)
			.replace(/-+$/g, '') || `product-${options.position + 1}`
	);
}

/** Whether the stored SKU is an untouched legacy automatic SKU, including its collision suffix. */
function isLegacyGeneratedSku(sku: string, legacySku: string): boolean {
	if (sku === legacySku) return true;
	if (!sku.startsWith(`${legacySku}-`)) return false;

	const suffix = sku.slice(legacySku.length + 1);
	return /^\d+$/.test(suffix) && Number(suffix) >= 2;
}

/**
 * Rewrites SKUs that still match the previous slug-based automatic format to the
 * compact format. Merchant-typed SKUs never match and stay untouched, and
 * suffixes resolve collisions with SKUs that already exist.
 */
export const backfillProductVariantSkus = migrations.define({
	table: 'productVariants',
	migrateOne: async (ctx, productVariant) => {
		const product = await ctx.db.get(productVariant.productId);
		if (!product) return;

		const optionValues = productVariant.options.map((option) => option.value);
		const legacySku = getLegacyGeneratedProductVariantSku({
			slug: product.slug,
			optionValues,
			position: productVariant.position
		});

		if (!isLegacyGeneratedSku(productVariant.sku, legacySku)) return;

		const base = getGeneratedProductVariantSku({
			slug: product.slug,
			optionValues,
			position: productVariant.position
		});
		if (base === productVariant.sku) return;

		let candidate = base;
		let suffix = 2;
		while (await isProductVariantSkuTaken(ctx, candidate, productVariant._id)) {
			candidate = `${base}-${suffix}`;
			suffix += 1;
		}

		return { sku: candidate };
	}
});
