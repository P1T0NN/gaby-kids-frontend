// LIBRARIES
import { v } from 'convex/values';

export const productVariantOption = v.object({
	name: v.string(),
	value: v.string()
});

export const cartProductVariantResult = v.object({
	id: v.id('productVariants'),
	productId: v.id('products'),
	name: v.string(),
	productVariantLabel: v.string(),
	priceInCents: v.number(),
	compareAtPriceInCents: v.optional(v.number()),
	image: v.optional(v.string()),
	trackInventory: v.boolean(),
	inventory: v.number(),
	reservedInventory: v.number()
});

export const productVariantInput = v.object({
	id: v.optional(v.id('productVariants')),
	options: v.array(productVariantOption),
	sku: v.string(),
	imageKeys: v.array(v.string()),
	priceInCents: v.number(),
	compareAtPriceInCents: v.optional(v.number()),
	inventory: v.number()
});

export const productVariantResult = v.object({
	_id: v.id('productVariants'),
	_creationTime: v.number(),
	productId: v.id('products'),
	position: v.number(),
	options: v.array(productVariantOption),
	sku: v.string(),
	imageKeys: v.array(v.string()),
	images: v.array(v.string()),
	priceInCents: v.number(),
	compareAtPriceInCents: v.optional(v.number()),
	inventory: v.number(),
	reservedInventory: v.number()
});
