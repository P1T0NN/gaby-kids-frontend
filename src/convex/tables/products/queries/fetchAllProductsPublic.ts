// CONVEX
import { query } from '../../../_generated/server.js';

// AGGREGATES
import { productsByStatusAggregate } from '../aggregates/productsByStatusAggregate.js';

// AGGREGATE HELPERS
import { getTotalSizeAggregate } from '../../../aggregates/helpers/getTotalSizeAggregate.js';

// HELPERS
import { getProductPage } from '../helpers/getProductPage.js';
import { withProductVariantSummaries } from '../helpers/enrichProductPage.js';

// OPTION INDEX
import { getProductOptionPage } from '../../productOptionIndex/helpers/getProductOptionPage.js';
import { resolveProductOptionSelection } from '../../productOptionIndex/utils/resolveProductOptionSelection.js';

// FILTERS
import {
	PRODUCT_AGE_GROUPS,
	PRODUCT_GENDERS
} from '../../../../shared/features/products/data/productsData.js';
import { normalizePageSize } from '../../../../shared/features/pagination/utils/normalizePageSize.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { storefrontProductPage } from '../validators/productValidators.js';

export const fetchAllProductsPublic = query({
	args: listPageArgs,
	returns: storefrontProductPage,
	handler: async (ctx, args) => {
		const search = args.search?.trim() || undefined;

		const filters = args.filters ?? {};
		const ageGroup = PRODUCT_AGE_GROUPS.find((value) => value === filters.ageGroup);
		const gender = PRODUCT_GENDERS.find((value) => value === filters.gender);
		const invalidAttributes = (filters.ageGroup && !ageGroup) || (filters.gender && !gender);
		if (invalidAttributes) {
			return {
				items: [],
				nextCursor: null,
				hasNextPage: false,
				total: undefined,
				pageSize: normalizePageSize(args.paginationOpts.numItems)
			};
		}
		const attributeFilters = { categorySlug: filters.category, ageGroup, gender };
		const hasAttributeFilters = Boolean(
			attributeFilters.categorySlug || attributeFilters.ageGroup || attributeFilters.gender
		);
		const optionKey = resolveProductOptionSelection(filters);
		const optionSelection = optionKey !== undefined;
		const canCountTotal = !search && !hasAttributeFilters && !optionSelection;

		const page = optionSelection
			? await getProductOptionPage({
					ctx,
					paginationOpts: args.paginationOpts,
					optionKey,
					search,
					attributeFilters,
					status: 'active',
					order: filters.sort === 'asc' ? 'asc' : 'desc'
				})
			: await getProductPage({
					ctx,
					paginationOpts: args.paginationOpts,
					search,
					attributeFilters,
					status: 'active',
					order: filters.sort === 'asc' ? 'asc' : 'desc'
				});

		const items = await withProductVariantSummaries({ ctx, items: page.items });
		const total = canCountTotal
			? await getTotalSizeAggregate(ctx, productsByStatusAggregate, { namespace: 'active' })
			: undefined;

		return { ...page, items, total };
	}
});
