export const ORDER_FILTER_VALUES = {
	paymentStatus: ['pending', 'paid', 'refund_pending', 'refunded'],
	fulfillmentStatus: ['unfulfilled', 'fulfilled'],
	fulfillmentMethod: ['delivery', 'pickup']
} as const;

export type OrderFilterField = keyof typeof ORDER_FILTER_VALUES;
