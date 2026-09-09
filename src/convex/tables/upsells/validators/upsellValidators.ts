import { v } from 'convex/values';

import { productResult } from '../../products/validators/productValidators.js';

export const upsellProductResult = v.object({
	productId: v.id('products'),
	product: v.union(productResult, v.null())
});

export const upsellsAdminPage = v.object({
	items: v.array(v.object({ product: productResult, upsells: v.array(upsellProductResult) })),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.optional(v.number())
});
