// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

import { getProductCategoryIds } from '../helpers/getProductCategoryIds.js';

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

		const categoryOptions = await Promise.all(
			getProductCategoryIds(product).map(async (id) => {
				const category = await ctx.db.get(id);
				if (!category) throw new Error('Product category invariant violated.');
				const { _id, name, slug, status } = category;
				return { _id, name, slug, status };
			})
		);

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
			categoryOptions,
			categoryOption: categoryOptions[0]
		};
	}
});
