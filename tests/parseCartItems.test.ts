import { expect, test } from 'vitest';
import { parseCartItems } from '../src/features/cart/utils/parseCartItems.js';

test('cart parsing preserves normalization and rejects malformed carts', () => {
	const item = { id: 'product', image: 'image.jpg', quantity: 2 };
	expect(parseCartItems(JSON.stringify([{ ...item, id: ' product ', extra: true }]))).toEqual([
		item
	]);
	expect(
		parseCartItems(JSON.stringify([{ id: 'legacy', images: ['old.jpg'], quantity: 1 }]))
	).toEqual([{ id: 'legacy', image: 'old.jpg', quantity: 1 }]);
	for (const raw of [
		null,
		'',
		'{',
		'{}',
		'[]',
		JSON.stringify([item, { ...item, quantity: 0 }]),
		JSON.stringify([{ ...item, quantity: 1.5 }]),
		JSON.stringify([{ ...item, image: 123 }])
	]) {
		expect(parseCartItems(raw)).toEqual([]);
	}
});
