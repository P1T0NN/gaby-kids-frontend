import { createOrderCode } from '../tables/orders/helpers/createOrderCode.js';
import { migrations } from './migrations.js';

export const backfillOrderCodes = migrations.define({
	table: 'orders',
	migrateOne: async (ctx, order) => {
		if (order.code !== undefined) return;
		for (let attempt = 0; attempt < 8; attempt += 1) {
			const code = createOrderCode();
			const collision = await ctx.db
				.query('orders')
				.withIndex('by_code', (query) => query.eq('code', code))
				.unique();
			if (!collision) return { code };
		}
		throw new Error('Could not allocate a unique order code.');
	}
});
