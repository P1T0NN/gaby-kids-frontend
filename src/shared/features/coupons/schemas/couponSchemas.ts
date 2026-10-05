// LIBRARIES
import { z } from 'zod';

// CONFIG
import { COUPONS_CONFIG } from '../config.js';

// UTILS
import { normalizeCouponCode } from '../utils/normalizeCouponCode.js';
import { parseAmountInput } from '../../../utils/pricing.js';

// TYPES
import type { Id } from '../../../../convex/_generated/dataModel.js';

const couponId = z
	.string()
	.min(1)
	.transform((value) => {
		// SAFETY: Convex validates the coupon ID at the mutation boundary.
		return value as Id<'coupons'>;
	});

const emptyToUndefined = z.literal('').transform(() => undefined);

/** Accepts the Form's string inputs as well as already-parsed Convex numbers. */
const optionalInteger = (schema: z.ZodNumber) =>
	z.union([emptyToUndefined, schema, z.string().trim().transform(Number).pipe(schema)]).optional();

/** Accepts a major-unit amount ("50.00") from the admin Form and stores minor units. */
const amountInCents = z
	.string()
	.trim()
	.transform((value) => parseAmountInput(value, 2))
	.pipe(z.number().int().min(1).max(COUPONS_CONFIG.maxMinSubtotalInCents));

const optionalAmountInCents = z
	.union([
		emptyToUndefined,
		z.number().int().min(1).max(COUPONS_CONFIG.maxMinSubtotalInCents),
		amountInCents
	])
	.optional();

/** Date input ("YYYY-MM-DD") expires at the end of that UTC day. */
const optionalExpiresAt = z
	.union([
		emptyToUndefined,
		z.number().int().positive(),
		z
			.string()
			.trim()
			.transform((value) => Date.parse(`${value}T23:59:59.999Z`))
			.pipe(z.number().int().positive())
	])
	.optional();

export const saveCouponSchema = z.object({
	name: z.string().trim().min(1).max(COUPONS_CONFIG.maxNameLength),
	code: z
		.string()
		.trim()
		.min(COUPONS_CONFIG.minCodeLength)
		.max(COUPONS_CONFIG.maxCodeLength)
		.transform(normalizeCouponCode),
	percentOff: z.coerce
		.number()
		.int()
		.min(COUPONS_CONFIG.minPercentOff)
		.max(COUPONS_CONFIG.maxPercentOff),
	active: z.boolean(),
	onePerCustomer: z.boolean(),
	expiresAt: optionalExpiresAt,
	minSubtotalInCents: optionalAmountInCents,
	maxRedemptions: optionalInteger(z.number().int().min(1).max(COUPONS_CONFIG.maxRedemptions))
});

export const setCouponActiveSchema = z.object({
	couponId,
	active: z.boolean()
});

export const deleteCouponSchema = z.object({
	couponId
});
