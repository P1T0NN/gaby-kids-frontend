// WRAPPERS
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';

// AGGREGATES
import { orderAggregate } from '../aggregates/orderAggregate.js';

// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { getOrderQuery } from '../helpers/getOrderQuery.js';

// FILTERS
import { buildOrderFilter } from '../../../../shared/features/orders/utils/buildOrderFilter.js';

// VALIDATORS
import { orderPage } from '../validators/orderValidators.js';

export const fetchAllOrdersAdmin = fetchOptimizedQuery({
	auth: 'admin',
	returns: orderPage,
	count: orderAggregate,
	predicateFor: buildOrderFilter,
	fetchPage: ({ ctx, paginationOpts, filters }) =>
		getPagination(getOrderQuery(ctx, filters), { paginationOpts })
});
