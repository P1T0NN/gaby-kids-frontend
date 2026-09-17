// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { query } from '../../../_generated/server.js';

// MAPPERS
import { toProductResult } from '../mappers/toProductResult.js';
import { toProductVariantResult } from '../../productVariants/mappers/toProductVariantResult.js';

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

		const productVariants: Awaited<ReturnType<typeof toProductVariantResult>>[] = [];
		for await (const productVariant of ctx.db
			.query('productVariants')
			.withIndex('by_product_id', (query) => query.eq('productId', product._id))) {
			productVariants.push(await toProductVariantResult(productVariant));
		}
		productVariants.sort((left, right) => left.position - right.position);

		const [details, upsells] = await Promise.all([
			toProductResult(product),
			getStorefrontUpsells(ctx, product)
		]);
		return { ...details, productVariants, upsells };
	}
});
