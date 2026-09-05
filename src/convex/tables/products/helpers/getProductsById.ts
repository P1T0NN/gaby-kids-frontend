import type { QueryCtx } from '../../../_generated/server.js';

export async function getProductsById(ctx: QueryCtx, ids: string[]) {
	return Promise.all(
		ids.map(async (value) => {
			const id = ctx.db.normalizeId('products', value);
			return id ? ctx.db.get('products', id) : null;
		})
	);
}
