// LIBRARIES
import { AuditActions } from 'convex-audit-log';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// SCHEMAS
import { saveCouponSchema } from '../../../../shared/features/coupons/schemas/couponSchemas.js';

// HELPERS
import { logAuditEvent } from '../../../auditLogs/helpers/logAuditEvent.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const saveCoupon = adminMutation({
	rateLimit: { name: 'coupons:save' },
	args: {
		name: v.string(),
		code: v.string(),
		percentOff: v.number(),
		active: v.boolean(),
		onePerCustomer: v.boolean(),
		expiresAt: v.optional(v.number()),
		minSubtotalInCents: v.optional(v.number()),
		maxRedemptions: v.optional(v.number())
	},
	returns: v.id('coupons'),
	handler: async (ctx, args) => {
		const parsed = saveCouponSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_COUPON_DATA' });
		const data = parsed.data;

		const existing = await ctx.db
			.query('coupons')
			.withIndex('by_code', (query) => query.eq('code', data.code))
			.unique();

		if (existing) throw new ConvexError<BackendErrorData>({ code: 'COUPON_CODE_TAKEN' });

		const couponId = await ctx.db.insert('coupons', { ...data, redemptionCount: 0 });

		await logAuditEvent(ctx, ctx.identity, {
			action: AuditActions.RECORD_CREATED,
			resourceType: 'coupons',
			resourceId: couponId,
			severity: 'info'
		});

		return couponId;
	}
});
