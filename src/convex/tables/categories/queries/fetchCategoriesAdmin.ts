// CONVEX
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { categoryAggregate } from '../aggregates/categoryAggregate.js';

// AGGREGATE HELPERS
import { getTotalSizeAggregate } from '../../../aggregates/helpers/getTotalSizeAggregate.js';

// HELPERS
import { getCategoryPage } from '../helpers/getCategoryPage.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { categoryPage } from '../validators/categoryValidators.js';

export const fetchCategoriesAdmin = adminQuery({
	args: listPageArgs,
	returns: categoryPage,
	handler: async (ctx, args) => {
		const search = args.search?.trim() || undefined;
		const canCountTotal = !search;
		const page = await getCategoryPage({ ctx, paginationOpts: args.paginationOpts, search });
		const total = canCountTotal ? await getTotalSizeAggregate(ctx, categoryAggregate) : undefined;

		return { ...page, total };
	}
});
