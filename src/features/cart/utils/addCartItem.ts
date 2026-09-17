import type { CartItem } from '@/shared/features/cart/types/cartTypes.js';

export function addCartItem(
	items: readonly CartItem[],
	item: Omit<CartItem, 'quantity'>
): CartItem[] {
	const normalizedProductVariantId = item.productVariantId.trim();
	if (!normalizedProductVariantId) return [...items];

	const index = items.findIndex(
		(cartItem) => cartItem.productVariantId === normalizedProductVariantId
	);
	if (index === -1) {
		return [...items, { ...item, productVariantId: normalizedProductVariantId, quantity: 1 }];
	}

	return items.map((cartItem, itemIndex) =>
		itemIndex === index ? { ...cartItem, quantity: cartItem.quantity + 1 } : { ...cartItem }
	);
}
