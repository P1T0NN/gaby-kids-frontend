import { describe, expect, it } from 'vitest';

import { buildCheckoutLineItems } from './buildCheckoutLineItems.js';
import type { Id } from '../../_generated/dataModel.js';
import { calculateOrderSavingsInCents } from '../../../shared/utils/pricing.js';

describe('buildCheckoutLineItems', () => {
	it('uses only the stored order snapshot fields', () => {
		// SAFETY: this pure formatter never performs a database lookup; the test uses opaque IDs.
		expect(
			buildCheckoutLineItems('eur', [
				{
					productId: 'product' as Id<'products'>,
					productVariantId: 'productVariant' as Id<'productVariants'>,
					name: 'Stored name',
					productVariantLabel: 'Red / M',
					sku: 'SHIRT-R-M',
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
						name: 'Stored name — Red / M',
						metadata: {
							productId: 'product',
							productVariantId: 'productVariant',
							productName: 'Stored name',
							productVariantLabel: 'Red / M',
							sku: 'SHIRT-R-M'
						},
						images: ['https://cdn.example.com/product.webp']
					}
				},
				quantity: 2
			}
		]);
	});
	it('appends one tagged shipping line when delivery has a fee', () => {
		// SAFETY: this pure formatter never performs a database lookup; the test uses opaque IDs.
		const items = [
			{
				productId: 'product' as Id<'products'>,
				productVariantId: 'productVariant' as Id<'productVariants'>,
				name: 'Stored name',
				productVariantLabel: 'Red / M',
				sku: 'SHIRT-R-M',
				unitPriceInCents: 1299,
				quantity: 2,
				imageUrl: 'https://cdn.example.com/product.webp'
			}
		];

		expect(buildCheckoutLineItems('eur', items, 3000)).toHaveLength(2);
		expect(buildCheckoutLineItems('eur', items, 3000)[1]).toEqual({
			price_data: {
				currency: 'eur',
				unit_amount: 3000,
				product_data: {
					name: 'Shipping',
					metadata: { kind: 'shipping' }
				}
			},
			quantity: 1
		});
		expect(buildCheckoutLineItems('eur', items, 0)).toHaveLength(1);
	});
});

describe('calculateOrderSavingsInCents', () => {
	it('multiplies each valid discount by its quantity', () => {
		expect(
			calculateOrderSavingsInCents([
				{ unitPriceInCents: 800, compareAtPriceInCents: 1000, quantity: 2 },
				{ unitPriceInCents: 500, compareAtPriceInCents: 400, quantity: 3 }
			])
		).toBe(400);
	});
});
