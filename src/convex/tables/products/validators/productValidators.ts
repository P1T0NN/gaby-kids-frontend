// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { v } from 'convex/values';

// CATEGORIES
import { categoryOption } from '../../categories/validators/categoryValidators.js';

// VALIDATORS
import { pageValidator } from '../../../validators/pageValidator.js';
import { productVariantResult } from '../../productVariants/validators/productVariantValidators.js';

export const productStatus = literals('draft', 'active', 'archived');

export const productResult = v.object({
	_id: v.id('products'),
	_creationTime: v.number(),
	name: v.string(),
	slug: v.string(),
	description: v.string(),
	productVariantOptionNames: v.array(v.string()),
	priceInCents: v.number(),
	compareAtPriceInCents: v.optional(v.number()),
	hasPriceRange: v.boolean(),
	categoryId: v.id('categories'),
	images: v.array(v.string()),
	imageKeys: v.array(v.string()),
	storagePrefix: v.string(),
	trackInventory: v.boolean(),
	upsellProductIds: v.array(v.id('products')),
	status: productStatus
});

export const productVariantSummary = v.object({
	count: v.number(),
	inventory: v.number(),
	reservedInventory: v.number(),
	/** Present only when the product has exactly one product variant. */
	defaultProductVariantId: v.optional(v.id('productVariants'))
});

export const adminProductResult = productResult.extend({
	categoryOption,
	productVariantSummary
});

export const adminProductDetailResult = productResult.extend({
	categoryOption,
	productVariants: v.array(productVariantResult)
});

export const storefrontProductResult = productResult.extend({ productVariantSummary });

export const storefrontUpsellResult = productResult
	.pick(
		'_id',
		'name',
		'slug',
		'priceInCents',
		'compareAtPriceInCents',
		'hasPriceRange',
		'images',
		'trackInventory'
	)
	.extend({ productVariantSummary });

export const storefrontProductDetailResult = productResult.extend({
	productVariants: v.array(productVariantResult),
	upsells: v.array(storefrontUpsellResult)
});

export const productPage = pageValidator(productResult);

export const storefrontProductPage = productPage.extend({
	items: v.array(storefrontProductResult)
});

export const adminProductPage = productPage.extend({ items: v.array(adminProductResult) });
