// WRAPPERS
import { fetchOptimizedSearchQuery } from '../../../wrappers/fetchOptimizedSearchQuery.js';

// VALIDATORS
import { categoryOptions } from '../validators/categoryValidators.js';

export const fetchCategoriesSearch = fetchOptimizedSearchQuery({
	returns: categoryOptions,
	fetchResults: async ({ ctx, search, limit }) => {
		const categories = await ctx.db
			.query('categories')
			.withSearchIndex('search_name', (query) => query.search('name', search))
			.take(limit);

		return categories.map(({ _id, name, slug, status }) => ({
			_id,
			name,
			slug,
			status
		}));
	}
});
