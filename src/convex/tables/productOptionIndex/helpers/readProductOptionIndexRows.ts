// TYPES
import type { Doc, Id } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

/** Every `productOptionIndex` row of one product. */
export async function readProductOptionIndexRows(
	ctx: MutationCtx,
	productId: Id<'products'>
): Promise<Doc<'productOptionIndex'>[]> {
	const rows: Doc<'productOptionIndex'>[] = [];

	for await (const row of ctx.db
		.query('productOptionIndex')
		.withIndex('by_product_id', (query) => query.eq('productId', productId))) {
		rows.push(row);
	}

	return rows;
}
