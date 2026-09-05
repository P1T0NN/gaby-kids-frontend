<script lang="ts">
	// COMPONENTS
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import FormField from './form-field.svelte';

	// TYPES
	import type { SelectField } from './formTypes.js';

	type Props = {
		field: SelectField;
		value: string;
		disabled?: boolean;
		error?: string;
		onValueChange: (value: string) => void;
	};

	let { field, value, disabled = false, error, onValueChange }: Props = $props();
</script>

<FormField {field} {disabled} {error}>
	<NativeSelect
		id={field.name}
		name={field.name}
		options={field.options}
		{value}
		label={field.label}
		includePlaceholderOption={false}
		class="w-full"
		required={field.required}
		{disabled}
		ariaInvalid={error ? 'true' : undefined}
		ariaDescribedby={error ? `${field.name}-error` : undefined}
		onchange={onValueChange}
	/>
</FormField>
