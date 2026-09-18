// CONFIG
import { PRODUCTS_CONFIG } from '../config.js';

export function isNewProductLabel(creationTime: number): boolean {
	return Date.now() - creationTime < PRODUCTS_CONFIG.NEW_PRODUCT_WINDOW_MS;
}
