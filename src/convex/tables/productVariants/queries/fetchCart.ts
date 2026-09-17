// LIBRARIES
import { ConvexError, v } from 'convex/values';

// CONVEX
import { query } from '../../../_generated/server.js';

// CONFIG
import { CART_CONFIG } from '../../../../shared/features/cart/config.js';

// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// UTILS
import { getProductVariantLabel } from '../../../../shared/features/productVariants/utils/getProductVariantLabel.js';

// VALIDATORS
import { cartProductVariantResult } from '../validators/productVariantValidators.js';

// TYPES
import type { CartProductVariant } from '../../../../shared/features/cart/types/cartTypes.js';

export const fetchCart = query({
	args: { productVariantIds: v.array(v.string()) },
	returns: v.object({
		items: v.array(cartProductVariantResult),
		invalidIds: v.array(v.string())
	}),
	handler: async (ctx, { productVariantIds }) => {
		if (productVariantIds.length > CART_CONFIG.maxItems) {
			throw new ConvexError('Cart item limit exceeded.');
		}

		const uniqueIds = [...new Set(productVariantIds)];
		const items: CartProductVariant[] = [];
		const invalidIds: string[] = [];

		for (const value of uniqueIds) {
			const productVariantId = ctx.db.normalizeId('productVariants', value);
			const productVariant = productVariantId ? await ctx.db.get(productVariantId) : null;
			const product = productVariant ? await ctx.db.get(productVariant.productId) : null;

			if (!productVariant || !product || product.status !== 'active') {
				invalidIds.push(value);
				continue;
			}

			const imageKey = productVariant.imageKeys[0] ?? (product.imageKeys ?? product.images)[0];
			const image = imageKey ? (await resolveStoredFileUrls([imageKey]))[0] : undefined;

			items.push({
				id: productVariant._id,
				productId: product._id,
				name: product.name,
				productVariantLabel: getProductVariantLabel(productVariant.options),
				priceInCents: productVariant.priceInCents,
				compareAtPriceInCents: productVariant.compareAtPriceInCents,
				image: image ?? undefined,
				trackInventory: product.trackInventory,
				inventory: productVariant.inventory,
				reservedInventory: productVariant.reservedInventory
			});
		}

		return { items, invalidIds };
	}
});
