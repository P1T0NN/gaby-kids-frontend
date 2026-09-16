export const ORDER_CONFIG = {
	maxLines: 50,
	maxQuantity: 99,
	maxStoredOrders: 100,
	localStorageKey: 'orders',
	codeLength: 6,
	checkoutReservationMinutes: 30,
	reservationCleanupIntervalMinutes: 5,
	reservationCleanupBatchSize: 10
} as const;
