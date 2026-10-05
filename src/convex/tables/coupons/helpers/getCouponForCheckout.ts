// LIBRARIES
import { ConvexError } from 'convex/values';

// CONFIG
import { COUPONS_CONFIG } from '../../../../shared/features/coupons/config.js';

// UTILS
import { calculateCouponDiscountInCents } from '../../../../shared/features/coupons/utils/calculateCouponDiscountInCents.js';
import { normalizeCouponCode } from '../../../../shared/features/coupons/utils/normalizeCouponCode.js';

// TYPES
import type { Doc, Id } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

type CouponLookupContext = Pick<QueryCtx, 'db'>;

export type CouponCheckoutOptions = {
	code: string;
	subtotalInCents: number;
	/** Whether the caller is authenticated; required when COUPONS_REQUIRE_SIGN_IN is on. */
	isSignedIn: boolean;
	/** Signed-in subject or the guest device id; absent skips the device check. */
	customerId?: string;
	/** Checkout email (orders store it lowercased); absent skips the email check. */
	email?: string;
};

/** The paid order that already redeemed this coupon for the customer, if any. */
async function findRedemptionByCustomer(
	ctx: CouponLookupContext,
	couponId: Id<'coupons'>,
	customerId: string
): Promise<Doc<'orders'> | null> {
	return ctx.db
		.query('orders')
		.withIndex('by_coupon_id_and_customer_id', (query) =>
			query.eq('couponId', couponId).eq('customerId', customerId)
		)
		.first();
}

/** The paid order that already redeemed this coupon for the email, if any. */
async function findRedemptionByEmail(
	ctx: CouponLookupContext,
	couponId: Id<'coupons'>,
	email: string
): Promise<Doc<'orders'> | null> {
	return ctx.db
		.query('orders')
		.withIndex('by_coupon_id_and_email', (query) =>
			query.eq('couponId', couponId).eq('email', email)
		)
		.first();
}

/**
 * One-per-customer coupons reject a paid order for the same account/device or
 * the same checkout email, so guests cannot bypass the rule by rotating their
 * device id.
 */
async function assertCustomerRedemptionAllowed(
	ctx: CouponLookupContext,
	coupon: Doc<'coupons'>,
	options: Pick<CouponCheckoutOptions, 'customerId' | 'email'>
): Promise<void> {
	if (!coupon.onePerCustomer) return;

	const normalizedEmail = options.email?.trim().toLowerCase();
	if (!options.customerId && !normalizedEmail) return;

	const [byCustomer, byEmail] = await Promise.all([
		options.customerId
			? findRedemptionByCustomer(ctx, coupon._id, options.customerId)
			: Promise.resolve(null),
		normalizedEmail
			? findRedemptionByEmail(ctx, coupon._id, normalizedEmail)
			: Promise.resolve(null)
	]);
	if (byCustomer || byEmail) {
		throw new ConvexError<BackendErrorData>({ code: 'COUPON_ALREADY_USED' });
	}
}

/**
 * Resolve a redeemable coupon for a merchandise subtotal, or throw the typed
 * rejection code the checkout UI translates. Both the preview query and the
 * trusted reservation mutation call this.
 */
export async function getCouponForCheckout(
	ctx: CouponLookupContext,
	options: CouponCheckoutOptions
): Promise<{ coupon: Doc<'coupons'>; discountInCents: number }> {
	const isSignInRequired = COUPONS_CONFIG.COUPONS_REQUIRE_SIGN_IN && !options.isSignedIn;
	if (isSignInRequired) {
		throw new ConvexError<BackendErrorData>({ code: 'COUPON_SIGN_IN_REQUIRED' });
	}

	const code = normalizeCouponCode(options.code);
	const coupon = code
		? await ctx.db
				.query('coupons')
				.withIndex('by_code', (query) => query.eq('code', code))
				.unique()
		: null;
	if (!coupon) throw new ConvexError<BackendErrorData>({ code: 'COUPON_NOT_FOUND' });
	if (!coupon.active) throw new ConvexError<BackendErrorData>({ code: 'COUPON_INACTIVE' });

	const isExpired = coupon.expiresAt !== undefined && Date.now() > coupon.expiresAt;
	if (isExpired) throw new ConvexError<BackendErrorData>({ code: 'COUPON_EXPIRED' });

	const minSubtotalInCents = coupon.minSubtotalInCents;
	const isBelowMinimumSubtotal =
		minSubtotalInCents !== undefined && options.subtotalInCents < minSubtotalInCents;

	if (isBelowMinimumSubtotal) {
		throw new ConvexError<BackendErrorData>({
			code: 'COUPON_MIN_SUBTOTAL',
			minSubtotalInCents
		});
	}

	const maxRedemptions = coupon.maxRedemptions;
	const hasReachedUsageLimit =
		maxRedemptions !== undefined && coupon.redemptionCount >= maxRedemptions;

	if (hasReachedUsageLimit) {
		throw new ConvexError<BackendErrorData>({ code: 'COUPON_USAGE_LIMIT_REACHED' });
	}

	await assertCustomerRedemptionAllowed(ctx, coupon, options);

	return {
		coupon,
		discountInCents: calculateCouponDiscountInCents(options.subtotalInCents, coupon.percentOff)
	};
}
