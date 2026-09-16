// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';
import type { ProductAvailability } from '../types/productsTypes.js';

export function getProductAvailability(
	product: Pick<Doc<'products'>, 'trackInventory' | 'inventory' | 'reservedInventory'>
): ProductAvailability {
	if (!product.trackInventory) return { type: 'unlimited' };

	const available = product.inventory - product.reservedInventory;
	if (available <= 0) {
		return product.inventory > 0 ? { type: 'temporarily_unavailable' } : { type: 'sold_out' };
	}
	return { type: 'available', quantity: available };
}
