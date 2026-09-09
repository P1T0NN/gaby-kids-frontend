// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { query } from '../../../_generated/server.js';

// HELPERS
import { getStorefrontUpsells } from '../helpers/getStorefrontUpsells.js';

// VALIDATORS
import { storefrontUpsellResult } from '../../products/validators/productValidators.js';

export const fetchProductUpsells = query({
	args: { productId: v.id('products') },
	returns: v.array(storefrontUpsellResult),
	handler: async (ctx, { productId }) => {
		const product = await ctx.db.get('products', productId);
		if (!product || product.status !== 'active') return [];
		return getStorefrontUpsells(ctx, product);
	}
});
