// TYPES
import type { ProductAvailability } from '../types/productsTypes.js';

type ProductStock = {
	trackInventory: boolean;
	inventory: number;
	reservedInventory: number;
};

export function getProductAvailability(stock: ProductStock): ProductAvailability {
	if (!stock.trackInventory) return { type: 'unlimited' };

	const available = stock.inventory - stock.reservedInventory;
	if (available <= 0) {
		return stock.inventory > 0 ? { type: 'temporarily_unavailable' } : { type: 'sold_out' };
	}
	return { type: 'available', quantity: available };
}
