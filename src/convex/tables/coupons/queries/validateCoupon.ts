// LIBRARIES
import { ConvexError, v } from 'convex/values';

// CONVEX
import { query } from '../../../_generated/server.js';

// HELPERS
import { getCouponForCheckout } from '../helpers/getCouponForCheckout.js';

// VALIDATORS
import { couponValidationResult } from '../validators/couponValidators.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Public preview of a coupon for the checkout summary; the reservation re-checks it. */
export const validateCoupon = query({
	args: {
		code: v.string(),
		subtotalInCents: v.number(),
		customerRef: v.optional(v.string()),
		email: v.optional(v.string())
	},
	returns: couponValidationResult,
	handler: async (ctx, args) => {
		if (!Number.isSafeInteger(args.subtotalInCents) || args.subtotalInCents <= 0) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
		}

		const identity = await ctx.auth.getUserIdentity();

		const { coupon, discountInCents } = await getCouponForCheckout(ctx, {
			code: args.code,
			subtotalInCents: args.subtotalInCents,
			isSignedIn: identity !== null,
			customerId: identity?.subject ?? args.customerRef,
			email: args.email
		});

		return {
			couponId: coupon._id,
			code: coupon.code,
			percentOff: coupon.percentOff,
			discountInCents
		};
	}
});
