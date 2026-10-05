/**
 * Percent-off discount on the merchandise subtotal, rounded to the nearest
 * cent and capped one cent below the subtotal so the payable total (including
 * shipping) can never reach zero. Shared by the checkout preview and the
 * trusted reservation calculation.
 */
export function calculateCouponDiscountInCents(
	subtotalInCents: number,
	percentOff: number
): number {
	if (!Number.isSafeInteger(subtotalInCents) || subtotalInCents <= 0) return 0;
	if (!Number.isInteger(percentOff) || percentOff <= 0 || percentOff > 100) return 0;

	const discount = Math.round((subtotalInCents * percentOff) / 100);
	return Math.max(0, Math.min(discount, subtotalInCents - 1));
}
