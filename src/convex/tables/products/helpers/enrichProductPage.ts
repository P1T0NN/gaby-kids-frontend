// HELPERS
import { getProductVariantSummary } from '../../productVariants/helpers/getProductVariantSummary.js';

// VALIDATORS
import { productResult } from '../validators/productValidators.js';

// TYPES
import type { Infer } from 'convex/values';
import type { QueryCtx } from '../../../_generated/server.js';

type ProductResult = Infer<typeof productResult>;

/** Append the variant stock summary to each storefront product row. */
export function withProductVariantSummaries({
	ctx,
	items
}: {
	ctx: QueryCtx;
	items: ProductResult[];
}) {
	return Promise.all(
		items.map(async (product) => ({
			...product,
			productVariantSummary: await getProductVariantSummary(ctx, product._id)
		}))
	);
}

/** Append the category option and variant stock summary to each admin product row. */
export function withProductCategoryAndVariantSummaries({
	ctx,
	items
}: {
	ctx: QueryCtx;
	items: ProductResult[];
}) {
	return Promise.all(
		items.map(async (product) => {
			const categoryOptions = await Promise.all(
				product.categoryIds.map(async (id) => {
					const category = await ctx.db.get(id);
					if (!category) throw new Error('Product category invariant violated.');
					const { _id, name, slug, status } = category;
					return { _id, name, slug, status };
				})
			);
			return {
				...product,
				categoryOptions,
				categoryOption: categoryOptions[0],
				productVariantSummary: await getProductVariantSummary(ctx, product._id)
			};
		})
	);
}
