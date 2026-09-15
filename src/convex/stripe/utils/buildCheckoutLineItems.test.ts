import { describe, expect, it } from 'vitest';

import { buildCheckoutLineItems } from './buildCheckoutLineItems.js';
import type { Id } from '../../_generated/dataModel.js';

describe('buildCheckoutLineItems', () => {
	it('uses only the stored order snapshot fields', () => {
		// SAFETY: this pure formatter never performs a database lookup; the test uses an opaque ID.
		expect(
			buildCheckoutLineItems('eur', [
				{
					productId: 'product' as Id<'products'>,
					name: 'Stored name',
					unitPriceInCents: 1299,
					quantity: 2,
					imageUrl: 'https://cdn.example.com/product.webp'
				}
			])
		).toEqual([
			{
				price_data: {
					currency: 'eur',
					unit_amount: 1299,
					product_data: {
						name: 'Stored name',
						metadata: { productId: 'product' },
						images: ['https://cdn.example.com/product.webp']
					}
				},
				quantity: 2
			}
		]);
	});
});
