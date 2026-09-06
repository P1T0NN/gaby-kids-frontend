<script lang="ts">
	// LIBRARIES
	import { getLocale } from '@/lib/paraglide/runtime';

	let {
		value,
		translations,
		locale
	}: {
		/** The raw value coming from the data, e.g. "apartment". */
		value: string;
		/** Dictionary: value → locale → label, e.g. `{ apartment: { en: "Apartment", es: "Apartamento" } }`. */
		translations: Record<string, Record<string, string>>;
		/** Optional locale override; otherwise Paraglide's current locale is used. */
		locale?: string;
	} = $props();

	const currentLocale = $derived(locale ?? getLocale());
	const label = $derived(
		translations[value]?.[currentLocale] ?? translations[value]?.['en'] ?? value
	);
</script>

{label}
