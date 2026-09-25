type OrderTotals = {
	subtotalInCents: number;
	shippingInCents?: number;
	totalInCents: number;
};

export function hasInvalidOrderTotals(
	calculatedSubtotalInCents: number,
	order: OrderTotals
): boolean {
	return (
		!Number.isSafeInteger(calculatedSubtotalInCents) ||
		calculatedSubtotalInCents <= 0 ||
		calculatedSubtotalInCents !== order.subtotalInCents ||
		calculatedSubtotalInCents + (order.shippingInCents ?? 0) !== order.totalInCents
	);
}
