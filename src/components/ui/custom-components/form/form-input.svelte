<script lang="ts">
	// COMPONENTS
	import Input from '@/components/ui/input/input.svelte';
	import FormField from './form-field.svelte';

	// UTILS
	import { formControlAttrs, formControlInput } from './formControl.js';

	// TYPES
	import type { InputField } from './formTypes.js';

	type Props = {
		field: InputField;
		value: string;
		disabled?: boolean;
		error?: string;
		onValueChange: (value: string) => void;
	};

	let { field, value, disabled = false, error, onValueChange }: Props = $props();
</script>

<FormField {field} {disabled} {error}>
	<Input
		{...formControlAttrs(field, error)}
		type={field.type ?? 'text'}
		{value}
		maxlength={field.maxLength}
		min={field.min}
		max={field.max}
		step={field.step}
		placeholder={field.placeholder}
		required={field.required}
		{disabled}
		oninput={formControlInput(onValueChange)}
	/>
</FormField>
