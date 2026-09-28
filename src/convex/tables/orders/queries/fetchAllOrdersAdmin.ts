// CONVEX
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { orderAggregate } from '../aggregates/orderAggregate.js';

// AGGREGATE HELPERS
import { getTotalSizeAggregate } from '../../../aggregates/helpers/getTotalSizeAggregate.js';

// HELPERS
import { getOrderPage } from '../helpers/getOrderPage.js';
import { readOrderFilters } from '../helpers/readOrderFilters.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { orderPage } from '../validators/orderValidators.js';

export const fetchAllOrdersAdmin = adminQuery({
	args: listPageArgs,
	returns: orderPage,
	handler: async (ctx, args) => {
		const search = args.search?.trim() || undefined;
		const filters = readOrderFilters(args.filters);
		const hasFilters = Boolean(
			filters.paymentStatus || filters.fulfillmentStatus || filters.fulfillmentMethod
		);
		const canCountTotal = !search && !hasFilters;
		const page = await getOrderPage({ ctx, paginationOpts: args.paginationOpts, filters });
		const total = canCountTotal ? await getTotalSizeAggregate(ctx, orderAggregate) : undefined;

		return { ...page, total };
	}
});
