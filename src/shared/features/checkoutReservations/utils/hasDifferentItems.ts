// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

type CheckoutItem = Pick<
	Doc<'checkoutReservations'>['items'][number],
	'productId' | 'name' | 'unitPriceInCents' | 'quantity'
>;

export function hasDifferentItems(
	reservedItems: Doc<'checkoutReservations'>['items'],
	checkoutItems: CheckoutItem[]
): boolean {
	if (reservedItems.length !== checkoutItems.length) return true;
	const checkoutByProduct = new Map(checkoutItems.map((item) => [item.productId, item]));

	return reservedItems.some((reservedItem) => {
		const checkoutItem = checkoutByProduct.get(reservedItem.productId);
		return (
			!checkoutItem ||
			checkoutItem.name !== reservedItem.name ||
			checkoutItem.unitPriceInCents !== reservedItem.unitPriceInCents ||
			checkoutItem.quantity !== reservedItem.quantity
		);
	});
}
