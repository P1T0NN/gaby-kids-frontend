// SVELTEKIT IMPORTS
import { goto } from '$app/navigation';

// UTILS
import { localizeHref } from '@/utils/localizeHref.js';

export function gotoParaglide(url: string, options?: Parameters<typeof goto>[1]) {
	// eslint-disable-next-line svelte/no-navigation-without-resolve
	return goto(localizeHref(url), options);
}
