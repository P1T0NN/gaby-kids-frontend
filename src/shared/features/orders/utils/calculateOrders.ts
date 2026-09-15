export type OrderCalculationItem = {
	unitPriceInCents: number;
	quantity: number;
};

export function calculateOrderTotalInCents(items: readonly OrderCalculationItem[]): number {
	return items.reduce((total, item) => total + item.unitPriceInCents * item.quantity, 0);
}
