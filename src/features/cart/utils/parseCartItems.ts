import { storedCartSchema } from '@/shared/features/cart/schemas/cartSchemas.js';
import type { CartItem } from '@/shared/features/cart/types/cartTypes.js';

export function parseCartItems(raw: string | null): CartItem[] {
	if (!raw) return [];
	try {
		const result = storedCartSchema.safeParse(JSON.parse(raw));
		return result.success ? result.data : [];
	} catch {
		return [];
	}
}
