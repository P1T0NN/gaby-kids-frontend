<script lang="ts">
	// LocalizedValue: maps a raw value stored in the DB (e.g. "apartment") to the
	// label for the current locale (e.g. "Apartamento" in es) — with no locale
	// plumbing in the app yet. The caller supplies the dictionary as a prop, so
	// this component never authors text, it only looks it up. Resolution order:
	// the given `locale`, then "en", then the raw `value` itself.
	let {
		value,
		translations,
		locale = 'en'
	}: {
		/** The raw value coming from the data, e.g. "apartment". */
		value: string;
		/** Dictionary: value → locale → label, e.g. `{ apartment: { en: "Apartment", es: "Apartamento" } }`. */
		translations: Record<string, Record<string, string>>;
		/** Current UI locale; falls back to "en", then to the raw `value`. */
		locale?: string;
	} = $props();

	const label = $derived(translations[value]?.[locale] ?? translations[value]?.['en'] ?? value);
</script>

{label}
