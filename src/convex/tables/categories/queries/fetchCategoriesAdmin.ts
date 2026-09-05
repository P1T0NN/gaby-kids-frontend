// WRAPPERS
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';

// AGGREGATES
import { categoryAggregate } from '../aggregates/categoryAggregate.js';

// HELPERS
import { getCategoryPage } from '../helpers/getCategoryPage.js';

// VALIDATORS
import { categoryPage } from '../validators/categoryValidators.js';

export const fetchCategoriesAdmin = fetchOptimizedQuery({
	auth: 'admin',
	returns: categoryPage,
	count: categoryAggregate,
	fetchPage: ({ ctx, paginationOpts, search }) => getCategoryPage(ctx, paginationOpts, search)
});
