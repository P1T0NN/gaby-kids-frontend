<script lang="ts">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import LocalizedValue from '@/components/ui/custom-components/localized-value/localized-value.svelte';

	// TYPES
	import type { BadgeVariant } from '@/components/ui/badge/index.js';
	import type { HTMLAttributes } from 'svelte/elements';

	// BadgeLocalized: the status case of LocalizedValue — most localized values
	// end up in a <Badge>. Same props as LocalizedValue (value, translations,
	// locale) plus the <Badge> props (variant, href, class, ...), which forward
	// to the badge. Kept separate from LocalizedValue so the plain-text form
	// stays available.
	let {
		value,
		translations,
		locale = 'en',
		variant = 'default',
		href,
		class: className,
		...restProps
	}: {
		/** The raw value coming from the data, e.g. "apartment". */
		value: string;
		/** Dictionary: value → locale → label, e.g. `{ apartment: { en: "Apartment", es: "Apartamento" } }`. */
		translations: Record<string, Record<string, string>>;
		/** Current UI locale; falls back to "en", then to the raw `value`. */
		locale?: string;
		variant?: BadgeVariant;
		/** When set, the badge renders as a link. */
		href?: string;
		class?: string;
	} & Omit<HTMLAttributes<HTMLElement>, 'class'> = $props();
</script>

<Badge {variant} {href} class={className} {...restProps}>
	<LocalizedValue {value} {translations} {locale} />
</Badge>
