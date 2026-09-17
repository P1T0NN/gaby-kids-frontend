// LIBRARIES
import { v } from 'convex/values';

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
	args: { asOf: v.optional(v.number()) },
	returns: storefrontProductPage,
	count: productsByStatusAggregate,
	countTotal: ({ ctx }) =>
		getTotalSizeAggregate(ctx, productsByStatusAggregate, { namespace: 'active' }),
	predicateFor: (key, value, args) => {
		if (key === 'photos' && (value === 'with' || value === 'without')) {
			return { field: 'hasImages', eq: value === 'with' };
		}
		const isRecentFilter = key === 'added' && value === '30d';
		if (isRecentFilter && args.asOf !== undefined && Number.isFinite(args.asOf)) {
			return { field: '_creationTime', gte: args.asOf - 30 * 24 * 60 * 60 * 1000 };
		}
		return buildProductFilter(key, value);
	},
	fetchPage: async ({ ctx, paginationOpts, search, filters }) => {
		const page = await getProductPage(ctx, paginationOpts, search, filters, 'active');
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
