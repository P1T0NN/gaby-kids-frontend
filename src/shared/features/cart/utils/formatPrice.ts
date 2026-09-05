// LIBRARIES
import { getLocale } from '@/lib/paraglide/runtime';

// CONFIG
import { COMPANY_DATA } from '@/shared/config.js';

const priceFormatter = new Intl.NumberFormat(getLocale(), {
	style: 'currency',
	currency: COMPANY_DATA.CURRENCY
});

export const formatPrice = (priceInCents: number) => priceFormatter.format(priceInCents / 100);
