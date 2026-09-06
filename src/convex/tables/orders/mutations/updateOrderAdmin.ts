// LIBRARIES
import { AuditActions } from 'convex-audit-log';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { logAuditEvent } from '../../../auditLogs/helpers/logAuditEvent.js';

// VALIDATORS
import { orderAdminAction, orderResult } from '../validators/orderValidators.js';

// SCHEMAS
import { updateOrderAdminSchema } from '../../../../shared/features/orders/schemas/ordersSchemas.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const updateOrderAdmin = adminMutation({
	rateLimit: { name: 'orders:update' },
	args: {
		id: v.id('orders'),
		action: orderAdminAction
	},
	returns: orderResult,
	handler: async (ctx, args) => {
		const parsed = updateOrderAdminSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
		const data = parsed.data;
		const order = await ctx.db.get(data.id);
		if (!order) throw new ConvexError<BackendErrorData>({ code: 'ORDER_NOT_FOUND' });
		const now = Date.now();

		switch (data.action) {
			case 'fulfill':
				if (order.paymentStatus !== 'paid')
					throw new ConvexError<BackendErrorData>({ code: 'ORDER_PAYMENT_REQUIRED' });
				if (order.cancelledAt !== undefined)
					throw new ConvexError<BackendErrorData>({ code: 'ORDER_CANCELLED' });
				await ctx.db.patch(data.id, { fulfillmentStatus: 'fulfilled', updatedAt: now });
				break;
			case 'unfulfill':
				await ctx.db.patch(data.id, { fulfillmentStatus: 'unfulfilled', updatedAt: now });
				break;
			case 'cancel':
				await ctx.db.patch(data.id, {
					fulfillmentStatus: 'unfulfilled',
					cancelledAt: order.cancelledAt ?? now,
					updatedAt: now
				});
				break;
			case 'restore':
				await ctx.db.patch(data.id, {
					fulfillmentStatus: 'unfulfilled',
					cancelledAt: undefined,
					updatedAt: now
				});
				break;
			case 'request_refund':
				if (order.paymentStatus === 'refund_pending' || order.paymentStatus === 'refunded')
					return order;
				if (order.paymentStatus !== 'paid')
					throw new ConvexError<BackendErrorData>({ code: 'ORDER_REFUND_UNAVAILABLE' });
				await ctx.db.patch(data.id, { paymentStatus: 'refund_pending', updatedAt: now });
				break;
		}

		await logAuditEvent(ctx, ctx.identity, {
			action: AuditActions.RECORD_UPDATED,
			resourceType: 'orders',
			resourceId: data.id,
			severity: 'info'
		});
		return (await ctx.db.get(data.id))!;
	}
});
