// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { v } from 'convex/values';

// CATEGORIES
import { categoryOption } from '../../categories/validators/categoryValidators.js';

export const productStatus = literals('draft', 'active', 'archived');

export const productResult = v.object({
	_id: v.id('products'),
	_creationTime: v.number(),
	name: v.string(),
	slug: v.string(),
	description: v.string(),
	priceInCents: v.number(),
	categoryId: v.id('categories'),
	images: v.array(v.string()),
	imageKeys: v.array(v.string()),
	storagePrefix: v.string(),
	status: productStatus
});

export const adminProductResult = productResult.extend({ categoryOption });

export const adminProductDetailResult = adminProductResult;

export const storefrontProductResult = productResult;

export const productPage = v.object({
	items: v.array(productResult),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.optional(v.number())
});

export const storefrontProductPage = productPage.extend({
	items: v.array(storefrontProductResult)
});

export const adminProductPage = productPage.extend({ items: v.array(adminProductResult) });
