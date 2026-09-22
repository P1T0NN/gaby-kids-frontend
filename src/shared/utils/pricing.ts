// LIBRARIES
import { getLocale } from '../../lib/paraglide/runtime.js';

// CONFIG
import { COMPANY_DATA } from '../config.js';

export type OrderCalculationItem = {
	unitPriceInCents: number;
	compareAtPriceInCents?: number;
	quantity: number;
};

const priceFormatters = new Map<string, Intl.NumberFormat>();
const compactPriceFormatters = new Map<string, Intl.NumberFormat>();

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

export function formatCompactPrice(
	priceInCents: number,
	currency: string = COMPANY_DATA.CURRENCY,
	locale: string = getLocale()
): string {
	const key = `${locale}:${currency}`;
	let formatter = compactPriceFormatters.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat(locale, {
			style: 'currency',
			currency,
			notation: 'compact',
			maximumFractionDigits: 1
		});
		compactPriceFormatters.set(key, formatter);
	}
	return formatter.format(priceInCents / 100);
}

/** Formats integer minor units as a plain decimal string ("19.99"); blank when absent. */
export function formatAmountInput(value: number | undefined, decimals: number): string {
	return value === undefined ? '' : (value / 10 ** decimals).toFixed(decimals);
}

/** Keeps digits and one decimal separator, capped at the allowed decimal places. */
export function sanitizeAmountInput(input: string, decimals: number): string {
	const normalized = input.replace(',', '.').replace(/[^\d.]/g, '');
	const [whole = '', ...fraction] = normalized.split('.');
	if (decimals === 0 || fraction.length === 0) return whole;
	return `${whole}.${fraction.join('').slice(0, decimals)}`;
}

/** Parses an editable amount string into integer minor units; undefined when blank or invalid. */
export function parseAmountInput(input: string, decimals: number): number | undefined {
	if (input === '' || input === '.') return undefined;
	const amount = Number(input);
	return Number.isFinite(amount) ? Math.round(amount * 10 ** decimals) : undefined;
}

export function getDiscountPercent(
	priceInCents: number,
	compareAtPriceInCents?: number
): number | null {
	if (compareAtPriceInCents === undefined || compareAtPriceInCents <= priceInCents) return null;

	return Math.round(((compareAtPriceInCents - priceInCents) / compareAtPriceInCents) * 100);
}

/** Payable price in cents after `discountPercent` off; null when the discount is unsupported. */
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
