import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

export async function releaseActiveReservation(
	ctx: MutationCtx,
	reservation: Doc<'checkoutReservations'>
): Promise<boolean> {
	if (reservation.status !== 'active') return false;

	for (const item of reservation.items) {
		if (!item.trackInventory) continue;
		const productVariant = await ctx.db.get(item.productVariantId);
		if (!productVariant || productVariant.reservedInventory < item.quantity) {
			throw new Error('Checkout reservation inventory invariant violated.');
		}
		await ctx.db.patch(item.productVariantId, {
			reservedInventory: productVariant.reservedInventory - item.quantity
		});
	}

	await ctx.db.patch(reservation._id, { status: 'released' });
	return true;
}
