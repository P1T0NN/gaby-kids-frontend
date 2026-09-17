// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

type OrderItemSnapshot = {
	productId: Id<'products'>;
	productVariantId: Id<'productVariants'>;
	name: string;
	productVariantLabel: string;
	sku: string;
	unitPriceInCents: number;
	quantity: number;
};

/** Snapshot order line items onto the order document. */
export async function insertOrderItems(
	ctx: MutationCtx,
	orderId: Id<'orders'>,
	items: OrderItemSnapshot[]
): Promise<void> {
	for (const item of items) {
		await ctx.db.insert('orderItems', {
			orderId,
			productId: item.productId,
			productVariantId: item.productVariantId,
			name: item.name,
			productVariantLabel: item.productVariantLabel,
			sku: item.sku,
			unitPriceInCents: item.unitPriceInCents,
			quantity: item.quantity
		});
	}
}
