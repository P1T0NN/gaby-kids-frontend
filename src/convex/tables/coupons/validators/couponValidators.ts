// LIBRARIES
import { v } from 'convex/values';

// VALIDATORS
import { pageValidator } from '../../../validators/pageValidator.js';

export const couponResult = v.object({
	_id: v.id('coupons'),
	_creationTime: v.number(),
	name: v.string(),
	code: v.string(),
	percentOff: v.number(),
	active: v.boolean(),
	expiresAt: v.optional(v.number()),
	minSubtotalInCents: v.optional(v.number()),
	maxRedemptions: v.optional(v.number()),
	onePerCustomer: v.boolean(),
	redemptionCount: v.number()
});

export const couponPage = pageValidator(couponResult);

export const couponValidationResult = v.object({
	couponId: v.id('coupons'),
	code: v.string(),
	percentOff: v.number(),
	discountInCents: v.number()
});
