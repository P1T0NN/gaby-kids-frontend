<script lang="ts">
	// LIBRARIES
	import { getLocale, isLocale, setLocale } from '@/lib/paraglide/runtime';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';

	// LANGUAGE NAMES ARE ENDONYMS SO EVERY VISITOR CAN FIND THEIR LANGUAGE
	const languageOptions = [
		{ value: 'es-MX', label: 'Español (México)' },
		{ value: 'es', label: 'Español' },
		{ value: 'en', label: 'English' }
	];

	function changeLocale(nextLocale: string): void {
		if (isLocale(nextLocale)) setLocale(nextLocale);
	}
</script>

<NativeSelect
	options={languageOptions}
	includePlaceholderOption={false}
	value={getLocale()}
	onchange={changeLocale}
	label={m['Components.LanguageSwitcher.label']()}
/>
