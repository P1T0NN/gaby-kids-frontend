// CONFIG
import { ORDER_CONFIG } from '../config.js';

/** Merchandise subtotal still missing to unlock free delivery; zero once qualified. */
export function getFreeShippingRemainingInCents(subtotalInCents: number): number {
	return Math.max(ORDER_CONFIG.freeShippingThresholdInCents - subtotalInCents, 0);
}
