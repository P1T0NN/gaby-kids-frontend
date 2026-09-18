// CONFIG
import { PRODUCTS_CONFIG } from '../config.js';

// TYPES
import type { ProductAvailability } from '../types/productsTypes.js';

export function checkStockStatusLabel(availability: ProductAvailability): number | null {
	if (availability.type !== 'available') return null;
	if (availability.quantity > PRODUCTS_CONFIG.LOW_STOCK_THRESHOLD) return null;
	return availability.quantity;
}
