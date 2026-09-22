<script lang="ts">
	// COMPONENTS
	import { Checkbox } from '@/components/ui/checkbox/index.js';
	import FormField from './form-field.svelte';

	// UTILS
	import { formControlAttrs } from './formControl.js';

	// TYPES
	import type { CheckboxField } from './formTypes.js';

	type Props = {
		field: CheckboxField;
		checked: boolean;
		disabled?: boolean;
		error?: string;
		onCheckedChange: (checked: boolean) => void;
	};

	let { field, checked, disabled = false, error, onCheckedChange }: Props = $props();
</script>

<FormField {field} {disabled} {error} labelPosition="after">
	<Checkbox
		{...formControlAttrs(field, error)}
		{checked}
		{disabled}
		onCheckedChange={(value) => onCheckedChange(value === true)}
	/>
</FormField>
