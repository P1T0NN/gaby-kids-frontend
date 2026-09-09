// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { query } from '../../../_generated/server.js';

// MAPPERS
import { toProductResult } from '../mappers/toProductResult.js';

// VALIDATORS
import { storefrontProductDetailResult } from '../validators/productValidators.js';

// HELPERS
import { getStorefrontUpsells } from '../../upsells/helpers/getStorefrontUpsells.js';

export const fetchProductBySlug = query({
	args: { slug: v.string() },
	returns: v.union(storefrontProductDetailResult, v.null()),
	handler: async (ctx, args) => {
		const product = await ctx.db
			.query('products')
			.withIndex('by_slug', (query) => query.eq('slug', args.slug))
			.unique();
		if (!product || product.status !== 'active') return null;

		const [details, upsells] = await Promise.all([
			toProductResult(product),
			getStorefrontUpsells(ctx, product)
		]);
		return { ...details, upsells };
	}
});
