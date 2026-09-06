<script lang="ts">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import LocalizedValue from '@/components/ui/custom-components/localized-value/localized-value.svelte';

	// LIBRARIES
	import { getLocale } from '@/lib/paraglide/runtime';

	// TYPES
	import type { BadgeVariant } from '@/components/ui/badge/index.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		value,
		translations,
		locale,
		variant = 'default',
		href,
		class: className,
		...restProps
	}: {
		/** The raw value coming from the data, e.g. "apartment". */
		value: string;
		/** Dictionary: value → locale → label, e.g. `{ apartment: { en: "Apartment", es: "Apartamento" } }`. */
		translations: Record<string, Record<string, string>>;
		/** Optional locale override; otherwise Paraglide's current locale is used. */
		locale?: string;
		variant?: BadgeVariant;
		/** When set, the badge renders as a link. */
		href?: string;
		class?: string;
	} & Omit<HTMLAttributes<HTMLElement>, 'class'> = $props();

	const currentLocale = $derived(locale ?? getLocale());
</script>

<Badge {variant} {href} class={className} {...restProps}>
	<LocalizedValue {value} {translations} locale={currentLocale} />
</Badge>
