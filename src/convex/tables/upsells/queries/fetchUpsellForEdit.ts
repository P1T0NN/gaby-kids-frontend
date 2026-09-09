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

export const fetchUpsellForEdit = adminQuery({
	args: { productId: v.id('products') },
	returns: v.object({ product: productResult, upsells: v.array(productResult) }),
	handler: async (ctx, { productId }) => {
		const product = await ctx.db.get('products', productId);
		if (!product) throw new ConvexError<BackendErrorData>({ code: 'PRODUCT_NOT_FOUND' });

		const upsells = await Promise.all(
			(product.upsellProductIds ?? []).map((id) => ctx.db.get('products', id))
		);
		
		const activeUpsells = upsells.filter(
			(upsell): upsell is NonNullable<(typeof upsells)[number]> =>
				upsell !== null && upsell.status === 'active'
		);

		return {
			product: await toProductResult(product),
			upsells: await Promise.all(activeUpsells.map(toProductResult))
		};
	}
});
