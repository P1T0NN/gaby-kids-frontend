// LIBRARIES
import { v } from 'convex/values';
import { query } from '../../../_generated/server.js';

// MAPPERS
import { toCategoryResult } from '../mappers/toCategoryResult.js';

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

		const sorted = categories.sort((left, right) => left.name.localeCompare(right.name));
		return Promise.all(sorted.map(toCategoryResult));
	}
});
