type OrderPerformance = {
	revenueInCents: number;
	orders: number;
};

export function getAverageOrderValue(orderPerformance: OrderPerformance): number {
	return orderPerformance.orders > 0
		? orderPerformance.revenueInCents / orderPerformance.orders
		: 0;
}
