// LIBRARIES
import { v } from 'convex/values';
import { query } from '../../../_generated/server.js';

// MAPPERS
import { toProductResult } from '../../products/mappers/toProductResult.js';

// VALIDATORS
import { storefrontProductResult } from '../../products/validators/productValidators.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';

export const fetchProductUpsells = query({
	args: { productId: v.id('products') },
	returns: v.array(storefrontProductResult),
	handler: async (ctx, { productId }) => {
		const product = await ctx.db.get('products', productId);
		if (!product || product.status !== 'active') return [];

		const recommendations = await Promise.all(
			(product.upsellProductIds ?? []).map((id) => ctx.db.get('products', id))
		);

		const activeProducts = recommendations.filter(
			(item): item is Doc<'products'> => item !== null && item.status === 'active'
		);

		return Promise.all(activeProducts.map(toProductResult));
	}
});
