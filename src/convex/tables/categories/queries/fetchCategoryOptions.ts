// CONVEX
import { query } from '../../../_generated/server.js';

// CONFIG
import { CATEGORY_CONFIG } from '../../../../shared/features/categories/config.js';

// VALIDATORS
import { categoryOptions } from '../validators/categoryValidators.js';

export const fetchCategoryOptions = query({
	args: {},
	returns: categoryOptions,
	handler: async (ctx) => {
		// ponytail: keep the public filter payload bounded; promote it to a searchable picker if the taxonomy outgrows this limit.
		const categories = await ctx.db
			.query('categories')
			.withIndex('by_status', (query) => query.eq('status', 'active'))
			.order('asc')
			.take(CATEGORY_CONFIG.maxPublicOptions);

		return categories
			.sort((left, right) => left.name.localeCompare(right.name))
			.map(({ _id, name, slug, status }) => ({
				_id,
				name,
				slug,
				status
			}));
	}
});
