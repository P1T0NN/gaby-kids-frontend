// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

export async function getOrderByReceiptToken(
	ctx: MutationCtx,
	receiptToken: string
): Promise<Doc<'orders'> | null> {
	return ctx.db
		.query('orders')
		.withIndex('by_receiptToken', (query) => query.eq('receiptToken', receiptToken))
		.unique();
}
