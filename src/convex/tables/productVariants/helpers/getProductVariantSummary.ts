// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ProductVariantSummary } from '../../../../shared/features/productVariants/types/productVariantTypes.js';

/** Bounded per-product stock summary for listing pages, streamed variant by variant. */
export async function getProductVariantSummary(
	ctx: QueryCtx,
	productId: Id<'products'>
): Promise<ProductVariantSummary> {
	let count = 0;
	let inventory = 0;
	let reservedInventory = 0;
	let defaultProductVariantId: Id<'productVariants'> | undefined;

	for await (const productVariant of ctx.db
		.query('productVariants')
		.withIndex('by_product_id', (query) => query.eq('productId', productId))) {
		count += 1;
		inventory += productVariant.inventory;
		reservedInventory += productVariant.reservedInventory;
		defaultProductVariantId = count === 1 ? productVariant._id : undefined;
	}

	return { count, inventory, reservedInventory, defaultProductVariantId };
}
