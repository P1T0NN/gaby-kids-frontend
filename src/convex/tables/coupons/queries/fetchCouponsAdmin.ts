// CONVEX
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { getCouponPage } from '../helpers/getCouponPage.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { couponPage } from '../validators/couponValidators.js';

export const fetchCouponsAdmin = adminQuery({
	args: listPageArgs,
	returns: couponPage,
	handler: async (ctx, args) => getCouponPage({ ctx, paginationOpts: args.paginationOpts })
});
