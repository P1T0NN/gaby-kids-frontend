// CONFIG
import { EMAIL_CLAIM_PAGE_SIZE } from '../../../../shared/features/customerEmailClaims/config.js';

// TYPES
import type { MutationCtx } from '../../../_generated/server.js';

export type EmailOrderTransfer = {
	transferred: number;
	continueCursor: string | null;
};

/**
 * Move one page of an email's orders to the account. The verified email owner always wins:
 * orders currently owned by another account are reassigned too. The cursor walks the email
 * index, which a `customerId` patch does not change, so the walk always terminates.
 */
export async function transferOrdersByEmail(
	ctx: MutationCtx,
	email: string,
	customerId: string,
	cursor: string | null
): Promise<EmailOrderTransfer> {
	const page = await ctx.db
		.query('orders')
		.withIndex('by_email', (query) => query.eq('email', email))
		.paginate({ cursor, numItems: EMAIL_CLAIM_PAGE_SIZE });

	let transferred = 0;
	for (const order of page.page) {
		if (order.customerId === customerId) continue;
		await ctx.db.patch(order._id, { customerId });
		transferred += 1;
	}

	return { transferred, continueCursor: page.isDone ? null : page.continueCursor };
}
