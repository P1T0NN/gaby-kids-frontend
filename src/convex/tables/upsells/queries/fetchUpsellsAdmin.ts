// WRAPPERS
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';

// HELPERS
import { getProductPage } from '../../products/helpers/getProductPage.js';

// MAPPERS
import { toProductResult } from '../../products/mappers/toProductResult.js';

// VALIDATORS
import { upsellsAdminPage } from '../validators/upsellValidators.js';

export const fetchUpsellsAdmin = fetchOptimizedQuery({
	auth: 'admin',
	returns: upsellsAdminPage,
	fetchPage: async ({ ctx, paginationOpts, search }) => {
		const page = await getProductPage(ctx, paginationOpts, search, [
			{ field: 'hasUpsells', eq: true }
		]);
		const items = await Promise.all(
			page.items.map(async (product) => ({
				product,
				upsells: await Promise.all(
					product.upsellProductIds.map(async (productId) => {
						const upsell = await ctx.db.get('products', productId);
						return {
							productId,
							product: upsell ? await toProductResult(upsell) : null
						};
					})
				)
			}))
		);

		return { ...page, items };
	}
});
