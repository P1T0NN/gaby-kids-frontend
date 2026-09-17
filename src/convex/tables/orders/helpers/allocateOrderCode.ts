// LIBRARIES
import { createOrderCode } from './createOrderCode.js';

// TYPES
import type { MutationCtx } from '../../../_generated/server.js';

/** Allocate a customer-facing order code, retrying while it collides. */
export async function allocateOrderCode(ctx: MutationCtx): Promise<string> {
	let code = createOrderCode();

	for (let attempt = 0; attempt < 7; attempt += 1) {
		const collision = await ctx.db
			.query('orders')
			.withIndex('by_code', (query) => query.eq('code', code))
			.unique();
		if (!collision) break;
		if (attempt === 6) throw new Error('Could not allocate a unique order code.');
		code = createOrderCode();
	}

	return code;
}
