// WRAPPERS
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';

// AGGREGATES
import { productAggregate } from '../aggregates/productAggregate.js';

// HELPERS
import { getProductPage } from '../helpers/getProductPage.js';

// VALIDATORS
import { adminProductPage } from '../validators/productValidators.js';

export const fetchAllProductsAdmin = fetchOptimizedQuery({
	auth: 'admin',
	returns: adminProductPage,
	count: productAggregate,
	fetchPage: async ({ ctx, paginationOpts, search, filters }) => {
		const page = await getProductPage(ctx, paginationOpts, search, filters);
		return {
			...page,
			items: await Promise.all(
				page.items.map(async (product) => {
					const category = await ctx.db.get(product.categoryId);
					if (!category) throw new Error('Product category invariant violated.');
					const { _id, name, slug, status } = category;
					return { ...product, categoryOption: { _id, name, slug, status } };
				})
			)
		};
	}
});
