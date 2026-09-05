// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// MAPPERS
import { toProductResult } from '../mappers/toProductResult.js';

// VALIDATORS
import { adminProductDetailResult } from '../validators/productValidators.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const fetchProductById = adminQuery({
	args: { id: v.id('products') },
	returns: adminProductDetailResult,
	handler: async (ctx, args) => {
		const product = await ctx.db.get(args.id);
		if (!product) {
			throw new ConvexError<BackendErrorData>({ code: 'PRODUCT_NOT_FOUND' });
		}

		const category = await ctx.db.get(product.categoryId);

		if (!category) throw new Error('Product category invariant violated.');
		const { _id, name, slug, status } = category;

		return {
			...(await toProductResult(product)),
			categoryOption: { _id, name, slug, status }
		};
	}
});
