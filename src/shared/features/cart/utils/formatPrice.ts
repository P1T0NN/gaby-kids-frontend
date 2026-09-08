// LIBRARIES
import { getLocale } from '@/lib/paraglide/runtime';

// CONFIG
import { COMPANY_DATA } from '@/shared/config.js';

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
