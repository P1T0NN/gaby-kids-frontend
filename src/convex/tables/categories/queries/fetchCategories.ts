// LIBRARIES
import { v } from 'convex/values';
import { query } from '../../../_generated/server.js';

// VALIDATORS
import { categoryResult } from '../validators/categoryValidators.js';

export const fetchCategories = query({
	args: {},
	returns: v.array(categoryResult),
	handler: async (ctx) => {
		// ponytail: categories are a small flat taxonomy, so the full active set is collected at once instead of paginated.
		const categories = await ctx.db
			.query('categories')
			.withIndex('by_status', (query) => query.eq('status', 'active'))
			.collect();

		return categories.sort((left, right) => left.name.localeCompare(right.name));
	}
});
