// CONVEX
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { getProductPage } from '../../products/helpers/getProductPage.js';
import { withResolvedUpsellProducts } from '../helpers/enrichUpsellPage.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { upsellsAdminPage } from '../validators/upsellValidators.js';

export const fetchUpsellsAdmin = adminQuery({
	args: listPageArgs,
	returns: upsellsAdminPage,
	handler: async (ctx, args) => {
		const search = args.search?.trim() || undefined;
		const page = await getProductPage({
			ctx,
			paginationOpts: args.paginationOpts,
			search,
			attributeFilters: {},
			hasUpsells: true
		});
		const items = await withResolvedUpsellProducts({ ctx, items: page.items });

		return { ...page, items };
	}
});
