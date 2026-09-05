import type { CartItem } from '@/shared/features/cart/types/cartTypes.js';

export function addCartItem(
	items: readonly CartItem[],
	item: Omit<CartItem, 'quantity'>
): CartItem[] {
	const normalizedId = item.id.trim();
	if (!normalizedId) return [...items];

	const index = items.findIndex((item) => item.id === normalizedId);
	if (index === -1) return [...items, { ...item, id: normalizedId, quantity: 1 }];

	return items.map((item, itemIndex) =>
		itemIndex === index ? { ...item, quantity: item.quantity + 1 } : { ...item }
	);
}
