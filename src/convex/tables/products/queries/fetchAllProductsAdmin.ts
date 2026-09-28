// CONVEX
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { productAggregate } from '../aggregates/productAggregate.js';

// AGGREGATE HELPERS
import { getTotalSizeAggregate } from '../../../aggregates/helpers/getTotalSizeAggregate.js';

// HELPERS
import { getProductPage } from '../helpers/getProductPage.js';
import { withProductCategoryAndVariantSummaries } from '../helpers/enrichProductPage.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { adminProductPage } from '../validators/productValidators.js';

export const fetchAllProductsAdmin = adminQuery({
	args: listPageArgs,
	returns: adminProductPage,
	handler: async (ctx, args) => {
		const search = args.search?.trim() || undefined;
		const upsellsWith = args.filters?.upsells === 'with';
		const canCountTotal = !search && !upsellsWith;
		const page = await getProductPage({
			ctx,
			paginationOpts: args.paginationOpts,
			search,
			attributeFilters: {},
			hasUpsells: upsellsWith
		});
		const items = await withProductCategoryAndVariantSummaries({ ctx, items: page.items });
		const total = canCountTotal ? await getTotalSizeAggregate(ctx, productAggregate) : undefined;

		return { ...page, items, total };
	}
});
