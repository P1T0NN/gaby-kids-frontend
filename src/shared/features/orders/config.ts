export const ORDER_CONFIG = {
	maxLines: 50,
	maxQuantity: 99,
	maxStoredOrders: 100,
	localStorageKey: 'orders',
	codeLength: 6,
	checkoutReservationMinutes: 30,
	reservationCleanupIntervalMinutes: 5,
	reservationCleanupBatchSize: 10,
	/** Flat delivery fee in minor units (cents). Pickup orders never pay it. */
	shippingFeeInCents: 3_000, // 30.00
	/** Delivery merchandise subtotal at or above this amount ships free. */
	freeShippingThresholdInCents: 20_000 // 200.00
} as const;
