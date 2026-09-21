// CONFIG
import { COMPANY_DATA } from '../../../shared/config.js';

// HELPERS
import { shardForOrder } from './dailySalesShards.js';

// UTILS
import { getStoreDayKey } from '../../../shared/utils/date.js';

// TYPES
import type { Doc } from '../../_generated/dataModel.js';
import type { MutationCtx } from '../../_generated/server.js';

type Order = Doc<'orders'>;
type SalesStatus = 'paid' | 'pending' | 'refunded' | 'cancelled';

/** Revenue is booked on the store day the order was paid, falling back to when it was placed. */
function getOrderDayKey(order: Order): number {
	return getStoreDayKey(order.paidAt ?? order._creationTime, COMPANY_DATA.TIMEZONE);
}

/**
 * One status per order for the rollup: a cancelled order stops counting (including its revenue),
 * a refund stops counting revenue, and only a paid order earns. This mirrors how the order admin
 * actions restate revenue when an order is cancelled or refunded.
 */
function classifyOrder(order: Order): SalesStatus {
	if (order.cancelledAt !== undefined) return 'cancelled';
	if (order.paymentStatus === 'refunded' || order.paymentStatus === 'refund_pending') {
		return 'refunded';
	}
	if (order.paymentStatus === 'paid') return 'paid';

	return 'pending';
}

function isSameDailySalesInput(previous: Order, next: Order): boolean {
	return (
		previous.paymentStatus === next.paymentStatus &&
		previous.cancelledAt === next.cancelledAt &&
		previous.totalInCents === next.totalInCents
	);
}

function toDailySalesDelta(order: Order) {
	const status = classifyOrder(order);

	return {
		orders: 1,
		paidOrders: status === 'paid' ? 1 : 0,
		pendingOrders: status === 'pending' ? 1 : 0,
		refundedOrders: status === 'refunded' ? 1 : 0,
		cancelledOrders: status === 'cancelled' ? 1 : 0,
		revenue: status === 'paid' ? order.totalInCents : 0
	};
}

async function findDayRow(ctx: MutationCtx, day: number, shard: number) {
	return ctx.db
		.query('dailySales')
		.withIndex('by_day_shard', (q) => q.eq('day', day).eq('shard', shard))
		.unique();
}

async function addOrderToDay(ctx: MutationCtx, order: Order): Promise<void> {
	const day = getOrderDayKey(order);
	const shard = shardForOrder(order._id);
	const row = await findDayRow(ctx, day, shard);
	const delta = toDailySalesDelta(order);

	if (row) {
		await ctx.db.patch(row._id, {
			orders: row.orders + delta.orders,
			paidOrders: row.paidOrders + delta.paidOrders,
			pendingOrders: row.pendingOrders + delta.pendingOrders,
			refundedOrders: row.refundedOrders + delta.refundedOrders,
			cancelledOrders: row.cancelledOrders + delta.cancelledOrders,
			revenue: row.revenue + delta.revenue
		});
		return;
	}

	await ctx.db.insert('dailySales', { day, shard, ...delta });
}

async function removeOrderFromDay(ctx: MutationCtx, order: Order): Promise<void> {
	const day = getOrderDayKey(order);
	const shard = shardForOrder(order._id);
	const row = await findDayRow(ctx, day, shard);
	if (!row) return;

	const delta = toDailySalesDelta(order);
	await ctx.db.patch(row._id, {
		orders: Math.max(0, row.orders - delta.orders),
		paidOrders: Math.max(0, row.paidOrders - delta.paidOrders),
		pendingOrders: Math.max(0, row.pendingOrders - delta.pendingOrders),
		refundedOrders: Math.max(0, row.refundedOrders - delta.refundedOrders),
		cancelledOrders: Math.max(0, row.cancelledOrders - delta.cancelledOrders),
		revenue: Math.max(0, row.revenue - delta.revenue)
	});
}

export async function applyOrderChangeToDailySales(
	ctx: MutationCtx,
	previous: Order | null,
	next: Order | null
): Promise<void> {
	if (previous && next && isSameDailySalesInput(previous, next)) return;
	if (previous) await removeOrderFromDay(ctx, previous);
	if (next) await addOrderToDay(ctx, next);
}
