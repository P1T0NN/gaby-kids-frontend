// LIBRARIES
import { AuditActions } from 'convex-audit-log';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// SCHEMAS
import { setCouponActiveSchema } from '../../../../shared/features/coupons/schemas/couponSchemas.js';

// HELPERS
import { logAuditEvent } from '../../../auditLogs/helpers/logAuditEvent.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const setCouponActive = adminMutation({
	rateLimit: { name: 'coupons:status' },
	args: { couponId: v.id('coupons'), active: v.boolean() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const parsed = setCouponActiveSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_COUPON_DATA' });

		const coupon = await ctx.db.get(parsed.data.couponId);
		if (!coupon) throw new ConvexError<BackendErrorData>({ code: 'COUPON_NOT_FOUND' });

		await ctx.db.patch(coupon._id, { active: parsed.data.active });

		await logAuditEvent(ctx, ctx.identity, {
			action: AuditActions.RECORD_UPDATED,
			resourceType: 'coupons',
			resourceId: coupon._id,
			severity: 'info'
		});

		return null;
	}
});
