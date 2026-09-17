// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';

/** Whether another product variant already stores this SKU. */
export async function isProductVariantSkuTaken(
	ctx: QueryCtx,
	sku: string,
	productVariantId: Id<'productVariants'> | undefined
): Promise<boolean> {
	const taken = await ctx.db
		.query('productVariants')
		.withIndex('by_sku', (query) => query.eq('sku', sku))
		.unique();
	return taken !== null && taken._id !== productVariantId;
}
