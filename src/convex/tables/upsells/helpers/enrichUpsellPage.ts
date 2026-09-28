// MAPPERS
import { toProductResult } from '../../products/mappers/toProductResult.js';

// VALIDATORS
import { productResult } from '../../products/validators/productValidators.js';

// TYPES
import type { Infer } from 'convex/values';
import type { QueryCtx } from '../../../_generated/server.js';

type ProductResult = Infer<typeof productResult>;

/** Resolve the ordered upsell products for each admin upsells row. */
export function withResolvedUpsellProducts({
	ctx,
	items
}: {
	ctx: QueryCtx;
	items: ProductResult[];
}) {
	return Promise.all(
		items.map(async (product) => ({
			product,
			upsells: await Promise.all(
				product.upsellProductIds.map(async (productId) => {
					const upsell = await ctx.db.get('products', productId);
					return {
						productId,
						product: upsell ? await toProductResult(upsell) : null
					};
				})
			)
		}))
	);
}
