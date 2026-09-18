// LIBRARIES
import { getLocale } from '@/lib/paraglide/runtime';

export const defaultXAxisFormat = (v: unknown) => {
	const locale = getLocale();

	if (v instanceof Date) {
		return v.toLocaleDateString(locale, { month: 'short' });
	}
	return String(v);
};

export const defaultLabelFormatter = (v: unknown) => {
	const locale = getLocale();

	if (v instanceof Date) {
		return v.toLocaleDateString(locale, { month: 'long' });
	}
	return String(v);
};
