// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

type CheckoutItem = Pick<
	Doc<'checkoutReservations'>['items'][number],
	'productVariantId' | 'unitPriceInCents' | 'quantity'
>;

/** The paid snapshot must match the reservation's identity, price, and quantity. */
export function hasDifferentItems(
	reservedItems: Doc<'checkoutReservations'>['items'],
	checkoutItems: CheckoutItem[]
): boolean {
	if (reservedItems.length !== checkoutItems.length) return true;
	const checkoutByProductVariant = new Map(
		checkoutItems.map((item) => [item.productVariantId, item])
	);

	return reservedItems.some((reservedItem) => {
		const checkoutItem = checkoutByProductVariant.get(reservedItem.productVariantId);
		return (
			!checkoutItem ||
			checkoutItem.unitPriceInCents !== reservedItem.unitPriceInCents ||
			checkoutItem.quantity !== reservedItem.quantity
		);
	});
}
