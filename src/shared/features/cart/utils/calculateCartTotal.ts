export function calculateDiscountedPrice({ price, discount }: { price: number; discount: number }) {
	return price * (1 - discount / 100);
}

export function calculateCartTotal(
	items: readonly { price: number; discount: number; quantity: number }[]
) {
	return items.reduce(
		(total, item) => total + calculateDiscountedPrice(item) * item.quantity,
		0
	);
}
