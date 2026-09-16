import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

export async function releaseActiveReservation(
	ctx: MutationCtx,
	reservation: Doc<'checkoutReservations'>
): Promise<boolean> {
	if (reservation.status !== 'active') return false;

	for (const item of reservation.items) {
		if (!item.trackInventory) continue;
		const product = await ctx.db.get(item.productId);
		if (!product || product.reservedInventory < item.quantity) {
			throw new Error('Checkout reservation inventory invariant violated.');
		}
		await ctx.db.patch(item.productId, {
			reservedInventory: product.reservedInventory - item.quantity
		});
	}

	await ctx.db.patch(reservation._id, { status: 'released' });
	return true;
}
