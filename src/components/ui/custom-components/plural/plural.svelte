<script lang="ts">
	// Plural: picks the right word form for a count, mirroring ICU plural
	// categories (one / few / many / other) so the swap to a real i18n
	// message (e.g. paraglide) later is a drop-in — same categories, same
	// `{count}` interpolation. The caller supplies the forms as a prop;
	// this component never authors text.
	let {
		count,
		forms,
		locale = 'en',
		class: className
	}: {
		/** The number that drives which form to pick. */
		count: number;
		/** Word forms per ICU plural category — `other` is the required fallback. */
		forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
		/** Current UI locale; defaults to "en" like the other i18n helpers. */
		locale?: string;
		class?: string;
	} = $props();

	// ICU categories resolve per locale — English only has one/other, but
	// e.g. Croatian has few/many, which `count === 1 ? '' : 's'` can't express.
	const category = $derived(new Intl.PluralRules(locale).select(count));
	const label = $derived(forms[category] ?? forms.other);
</script>

<span class={className}>{count} {label}</span>
