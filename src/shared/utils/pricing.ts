// LIBRARIES
import { getLocale } from '@/lib/paraglide/runtime';

// CONFIG
import { COMPANY_DATA } from '@/shared/config.js';

type OptionalPriceInput = string | number | boolean | null | undefined;

export type OrderCalculationItem = {
	unitPriceInCents: number;
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

export function parseOptionalPriceInCents(value: OptionalPriceInput): number | undefined {
	const normalized = String(value ?? '').trim();
	return normalized ? Math.round(Number(normalized) * 100) : undefined;
}

export function getDiscountPercent(
	priceInCents: number,
	compareAtPriceInCents?: number
): number | null {
	if (compareAtPriceInCents === undefined || compareAtPriceInCents <= priceInCents) return null;

	return Math.round(((compareAtPriceInCents - priceInCents) / compareAtPriceInCents) * 100);
}

export function calculateOrderTotalInCents(items: readonly OrderCalculationItem[]): number {
	return items.reduce((total, item) => total + item.unitPriceInCents * item.quantity, 0);
}
