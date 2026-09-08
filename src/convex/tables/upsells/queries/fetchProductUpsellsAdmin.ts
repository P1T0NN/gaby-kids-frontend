// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// MAPPERS
import { toProductResult } from '../../products/mappers/toProductResult.js';

// VALIDATORS
import { productResult } from '../../products/validators/productValidators.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const fetchProductUpsellsAdmin = adminQuery({
	args: { productId: v.id('products') },
	returns: v.object({
		product: productResult,
		upsells: v.array(
			v.object({ productId: v.id('products'), product: v.union(productResult, v.null()) })
		)
	}),
	handler: async (ctx, { productId }) => {
		const product = await ctx.db.get('products', productId);
		if (!product) throw new ConvexError<BackendErrorData>({ code: 'PRODUCT_NOT_FOUND' });

		const upsells = await Promise.all(
			(product.upsellProductIds ?? []).map(async (id) => {
				const recommendation = await ctx.db.get('products', id);

				return {
					productId: id,
					product: recommendation ? await toProductResult(recommendation) : null
				};
			})
		);
		
		return { product: await toProductResult(product), upsells };
	}
});
