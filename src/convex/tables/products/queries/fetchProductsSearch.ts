// LIBRARIES
import { v } from 'convex/values';

// WRAPPERS
import { fetchOptimizedSearchQuery } from '../../../wrappers/fetchOptimizedSearchQuery.js';

// MAPPERS
import { toProductResult } from '../mappers/toProductResult.js';

// VALIDATORS
import { productResult } from '../validators/productValidators.js';

export const fetchProductsSearch = fetchOptimizedSearchQuery({
	auth: 'admin',
	returns: v.array(productResult),
	fetchResults: async ({ ctx, search, limit }) => {
		const products = await ctx.db
			.query('products')
			.withSearchIndex('search_name', (query) => query.search('name', search))
			.take(limit);

		return Promise.all(products.map(toProductResult));
	}
});
