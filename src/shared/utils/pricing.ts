// LIBRARIES
import { getLocale } from '../../lib/paraglide/runtime.js';

// CONFIG
import { COMPANY_DATA } from '../config.js';

export type PriceInput = string | number | boolean | null | undefined;

export type OrderCalculationItem = {
	unitPriceInCents: number;
	compareAtPriceInCents?: number;
	quantity: number;
};

const priceFormatters = new Map<string, Intl.NumberFormat>();

export function formatPrice(
	priceInCents: number,
	currency: string = COMPANY_DATA.CURRENCY,
	locale: string = getLocale()
): string {
	const key = `${locale}:${currency}`;
	let formatter = priceFormatters.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
		priceFormatters.set(key, formatter);
	}
	return formatter.format(priceInCents / 100);
}

export function priceInCents(value: PriceInput): number {
	return Math.round(Number(value) * 100);
}

export function parseOptionalPriceInCents(value: PriceInput): number | undefined {
	const normalized = String(value ?? '').trim();
	return normalized ? priceInCents(normalized) : undefined;
}

export function getDiscountPercent(
	priceInCents: number,
	compareAtPriceInCents?: number
): number | null {
	if (compareAtPriceInCents === undefined || compareAtPriceInCents <= priceInCents) return null;

	return Math.round(((compareAtPriceInCents - priceInCents) / compareAtPriceInCents) * 100);
}

export function calculateDiscountedPriceInCents(
	priceInCents: number,
	discountPercent: number
): number | null {
	const validDiscount =
		Number.isSafeInteger(priceInCents) &&
		priceInCents > 0 &&
		Number.isInteger(discountPercent) &&
		discountPercent >= 5 &&
		discountPercent <= 95 &&
		discountPercent % 5 === 0;
	if (!validDiscount) return null;

	const discountedPriceInCents = Math.round((priceInCents * (100 - discountPercent)) / 100);
	return discountedPriceInCents > 0 && discountedPriceInCents < priceInCents
		? discountedPriceInCents
		: null;
}

export function calculateOrderTotalInCents(items: readonly OrderCalculationItem[]): number {
	return items.reduce((total, item) => total + item.unitPriceInCents * item.quantity, 0);
}

export function calculateOrderSavingsInCents(items: readonly OrderCalculationItem[]): number {
	return items.reduce(
		(savings, item) =>
			savings +
			Math.max((item.compareAtPriceInCents ?? item.unitPriceInCents) - item.unitPriceInCents, 0) *
				item.quantity,
		0
	);
}
