// LIBRARIES
import {
	deLocalizeHref,
	getStrategyForUrl,
	localizeHref as paraglideLocalizeHref
} from '@/lib/paraglide/runtime';

export function localizeHref(href: string): string {
	return getStrategyForUrl(href).includes('url')
		? paraglideLocalizeHref(href)
		: deLocalizeHref(href);
}
