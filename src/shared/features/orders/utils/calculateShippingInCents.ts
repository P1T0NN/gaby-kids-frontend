// CONFIG
import { ORDER_CONFIG } from '../config.js';

type FulfillmentMethod = 'delivery' | 'pickup';

/** Delivery orders under the free-shipping threshold pay the flat fee; pickup is always free. */
export function calculateShippingInCents(
	subtotalInCents: number,
	fulfillmentMethod: FulfillmentMethod
): number {
	if (fulfillmentMethod === 'pickup') return 0;
	if (subtotalInCents >= ORDER_CONFIG.freeShippingThresholdInCents) return 0;
	return ORDER_CONFIG.shippingFeeInCents;
}
