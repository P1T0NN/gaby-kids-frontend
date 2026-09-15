type OrderTotals = {
	subtotalInCents: number;
	totalInCents: number;
};

export function hasInvalidOrderTotals(calculatedTotalInCents: number, order: OrderTotals): boolean {
	return (
		!Number.isSafeInteger(calculatedTotalInCents) ||
		calculatedTotalInCents <= 0 ||
		calculatedTotalInCents !== order.subtotalInCents ||
		calculatedTotalInCents !== order.totalInCents
	);
}
