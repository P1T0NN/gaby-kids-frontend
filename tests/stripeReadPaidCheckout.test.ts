/// <reference types="vite/client" />

import { expect, test } from 'vitest';
import type Stripe from 'stripe';

import { readPaidCheckout } from '../src/convex/stripe/helpers/readPaidCheckout';

// Fixtures keep only the fields `readPaidCheckout` reads. Stripe's own types are
// assignable to these shapes, so callers only need one assertion (no `as unknown as`).
type FixtureProduct = { metadata?: Record<string, string> };
type FixturePrice = {
	unit_amount: number | null;
	currency: string;
	product: FixtureProduct | string | null;
};
type FixtureLineItem = {
	amount_discount: number;
	amount_subtotal: number;
	amount_tax: number;
	amount_total: number;
	currency: string;
	description: string | null;
	price: FixturePrice | null;
	quantity: number | null;
};
type FixtureLinePage = {
	object: 'list';
	data: FixtureLineItem[];
	has_more: boolean;
	url: string;
};
type FixtureSession = {
	mode: Stripe.Checkout.Session['mode'];
	status: Stripe.Checkout.Session['status'];
	payment_status: Stripe.Checkout.Session['payment_status'];
	currency: string;
	amount_total: number;
	metadata: Stripe.Metadata | null;
};

/** A Stripe Checkout line item whose `amount_total` includes its allocated discount. */
function lineItem(options: {
	unitPriceInCents: number;
	quantity: number;
	discountInCents: number;
	name: string;
	kind?: 'shipping';
}): FixtureLineItem {
	const subtotalInCents = options.unitPriceInCents * options.quantity;
	const baseMetadata = {
		productId: 'product_1',
		productVariantId: 'variant_1',
		productName: options.name,
		productVariantLabel: 'Red',
		sku: 'sku-1'
	};
	const metadata = options.kind ? { ...baseMetadata, kind: options.kind } : baseMetadata;

	return {
		amount_discount: options.discountInCents,
		amount_subtotal: subtotalInCents,
		amount_tax: 0,
		amount_total: subtotalInCents - options.discountInCents,
		currency: 'eur',
		description: options.name,
		price: {
			unit_amount: options.unitPriceInCents,
			currency: 'eur',
			product: { metadata }
		},
		quantity: options.quantity
	};
}

function paidSession(options: {
	itemCount: number;
	totalInCents: number;
	shippingInCents: number;
	discountInCents: number;
}): FixtureSession {
	return {
		mode: 'payment',
		status: 'complete',
		payment_status: 'paid',
		currency: 'eur',
		amount_total: options.totalInCents,
		metadata: {
			receiptToken: 'receipt-token',
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			phone: '123',
			fulfillmentMethod: 'pickup',
			customerId: '',
			currency: 'eur',
			itemCount: String(options.itemCount),
			shippingInCents: String(options.shippingInCents),
			discountInCents: String(options.discountInCents),
			totalInCents: String(options.totalInCents),
			couponId: 'coupon_1',
			couponCode: 'SAVE10'
		}
	};
}

test('a discounted product line keeps its pre-discount unit price and subtotal', () => {
	const page: FixtureLinePage = {
		object: 'list',
		data: [lineItem({ unitPriceInCents: 1000, quantity: 1, discountInCents: 100, name: 'Shirt' })],
		has_more: false,
		url: '/line_items'
	};
	const session = paidSession({
		itemCount: 1,
		totalInCents: 900,
		shippingInCents: 0,
		discountInCents: 100
	});

	// SAFETY: readPaidCheckout reads only the fixture fields, and Stripe's own types are
	// assignable to these fixture shapes.
	const checkout = readPaidCheckout(
		session as Stripe.Checkout.Session,
		page as Stripe.ApiList<Stripe.LineItem>
	);

	expect(checkout).toMatchObject({
		subtotalInCents: 1000,
		shippingInCents: 0,
		discountInCents: 100,
		totalInCents: 900
	});
	expect(checkout.items[0]).toMatchObject({ unitPriceInCents: 1000, quantity: 1 });
});

test('discount allocation on the shipping line still yields the tagged shipping fee', () => {
	const page: FixtureLinePage = {
		object: 'list',
		data: [
			lineItem({ unitPriceInCents: 1000, quantity: 1, discountInCents: 100, name: 'Shirt' }),
			lineItem({
				unitPriceInCents: 300,
				quantity: 1,
				discountInCents: 30,
				name: 'Shipping',
				kind: 'shipping'
			})
		],
		has_more: false,
		url: '/line_items'
	};
	const session = paidSession({
		itemCount: 1,
		totalInCents: 1170,
		shippingInCents: 300,
		discountInCents: 130
	});

	// SAFETY: readPaidCheckout reads only the fixture fields, and Stripe's own types are
	// assignable to these fixture shapes.
	const checkout = readPaidCheckout(
		session as Stripe.Checkout.Session,
		page as Stripe.ApiList<Stripe.LineItem>
	);

	expect(checkout).toMatchObject({
		subtotalInCents: 1000,
		shippingInCents: 300,
		discountInCents: 130,
		totalInCents: 1170
	});
});
