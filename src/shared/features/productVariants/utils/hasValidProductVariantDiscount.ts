/**
 * A product variant discount is valid when the regular price is absent (no
 * discount) or when the payable price is strictly below the regular price.
 */
export function hasValidProductVariantDiscount(
	regularPriceInCents: number | undefined,
	payablePriceInCents: number
): boolean {
	if (regularPriceInCents === undefined) return true;
	return payablePriceInCents < regularPriceInCents;
}
