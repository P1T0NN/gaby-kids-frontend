// LIBRARIES
import { v } from 'convex/values';
import { query } from '../../../_generated/server.js';
import { resolveStoredFileUrls } from '../../../storage/r2.js';

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

		const sortedCategories = categories.sort((left, right) => left.name.localeCompare(right.name));
		const imageKeys = sortedCategories.flatMap((category) =>
			category.imageKey ? [category.imageKey] : []
		);
		const imageUrls = await resolveStoredFileUrls(imageKeys);
		const imageUrlByKey = new Map(imageKeys.map((key, index) => [key, imageUrls[index]]));

		return sortedCategories.map((category) => {
			const image = category.imageKey ? imageUrlByKey.get(category.imageKey) : undefined;
			if (!image) return category;

			return { ...category, image };
		});
	}
});
