// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { query } from '../../../_generated/server.js';

// CONFIG
import { CART_CONFIG } from '../../../../shared/features/cart/config.js';

// HELPERS
import { getProductsById } from '../helpers/getProductsById.js';

// TYPES
import type { CartProduct } from '../../../../shared/features/cart/types/cartTypes.js';

export const fetchCart = query({
	args: { ids: v.array(v.string()) },
	returns: v.object({
		products: v.array(
			v.object({
				id: v.id('products'),
				name: v.string(),
				priceInCents: v.number(),
				compareAtPriceInCents: v.optional(v.number()),
				trackInventory: v.boolean(),
				inventory: v.number(),
				reservedInventory: v.number()
			})
		),
		invalidIds: v.array(v.string())
	}),
	handler: async (ctx, { ids }) => {
		if (ids.length > CART_CONFIG.maxItems) throw new ConvexError('Cart item limit exceeded.');

		const uniqueIds = [...new Set(ids)];

		const found = await getProductsById(ctx, uniqueIds);

		const products: CartProduct[] = [];

		const invalidIds: string[] = [];

		found.forEach((product, index) => {
			if (!product || product.status !== 'active') {
				invalidIds.push(uniqueIds[index]);
			} else {
				const cartProduct = {
					id: product._id,
					name: product.name,
					priceInCents: product.priceInCents ?? 0,
					trackInventory: product.trackInventory,
					inventory: product.inventory,
					reservedInventory: product.reservedInventory
				};
				products.push(
					product.compareAtPriceInCents === undefined
						? cartProduct
						: { ...cartProduct, compareAtPriceInCents: product.compareAtPriceInCents }
				);
			}
		});
		return { products, invalidIds };
	}
});
