// WRAPPERS
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';

// AGGREGATES
import { productsByStatusAggregate } from '../aggregates/productsByStatusAggregate.js';

// AGGREGATE HELPERS
import { getTotalSizeAggregate } from '../../../aggregates/helpers/getTotalSizeAggregate.js';

// HELPERS
import { buildProductFilter } from '../utils/filterPredicates.js';
import { getProductPage } from '../helpers/getProductPage.js';
import { getProductVariantSummary } from '../../productVariants/helpers/getProductVariantSummary.js';

// VALIDATORS
import { storefrontProductPage } from '../validators/productValidators.js';

export const fetchAllProductsPublic = fetchOptimizedQuery({
	returns: storefrontProductPage,
	count: productsByStatusAggregate,
	countTotal: ({ ctx }) =>
		getTotalSizeAggregate(ctx, productsByStatusAggregate, { namespace: 'active' }),
	predicateFor: buildProductFilter,
	fetchPage: async ({ ctx, args, paginationOpts, search, filters }) => {
		const sortOrder = args.filters?.sort === 'asc' ? 'asc' : 'desc';
		const page = await getProductPage(ctx, paginationOpts, search, filters, 'active', sortOrder);
		return {
			...page,
			items: await Promise.all(
				page.items.map(async (product) => ({
					...product,
					productVariantSummary: await getProductVariantSummary(ctx, product._id)
				}))
			)
		};
	}
});
