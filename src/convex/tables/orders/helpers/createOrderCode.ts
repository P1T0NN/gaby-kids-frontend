// CONFIG
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function createOrderCode(random = Math.random): string {
	return Array.from(
		{ length: ORDER_CONFIG.codeLength },
		() => ALPHABET[Math.floor(random() * ALPHABET.length)]
	).join('');
}
