import { expect, test } from 'vitest';
import { parseCartItems } from '../src/features/cart/utils/parseCartItems.js';

test('cart parsing preserves normalization and rejects malformed or legacy carts', () => {
	const item = { productVariantId: 'productVariant', image: 'image.jpg', quantity: 2 };
	expect(
		parseCartItems(JSON.stringify([{ ...item, productVariantId: ' productVariant ', extra: true }]))
	).toEqual([item]);
	for (const raw of [
		null,
		'',
		'{',
		'{}',
		'[]',
		JSON.stringify([item, { ...item, quantity: 0 }]),
		JSON.stringify([{ ...item, quantity: 1.5 }]),
		JSON.stringify([{ ...item, image: 123 }]),
		JSON.stringify([{ id: 'legacy', image: 'old.jpg', quantity: 1 }])
	]) {
		expect(parseCartItems(raw)).toEqual([]);
	}
});
