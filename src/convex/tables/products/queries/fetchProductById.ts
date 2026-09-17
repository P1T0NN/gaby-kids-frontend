// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// MAPPERS
import { toProductResult } from '../mappers/toProductResult.js';
import { toProductVariantResult } from '../../productVariants/mappers/toProductVariantResult.js';

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

		const productVariants: Awaited<ReturnType<typeof toProductVariantResult>>[] = [];
		for await (const productVariant of ctx.db
			.query('productVariants')
			.withIndex('by_product_id', (query) => query.eq('productId', product._id))) {
			productVariants.push(await toProductVariantResult(productVariant));
		}
		productVariants.sort((left, right) => left.position - right.position);

		return {
			...(await toProductResult(product)),
			productVariants,
			categoryOption: { _id, name, slug, status }
		};
	}
});
