<script lang="ts">
	// COMPONENTS
	import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field/index.js';
	import { Switch } from '@/components/ui/switch/index.js';

	// TYPES
	import type { SwitchField } from './formTypes.js';

	type Props = {
		field: SwitchField;
		checked: boolean;
		disabled?: boolean;
		error?: string;
		onCheckedChange: (checked: boolean) => void;
	};

	let { field, checked, disabled = false, error, onCheckedChange }: Props = $props();
</script>

<Field class="flex-col gap-2" data-disabled={disabled} data-invalid={Boolean(error)}>
	<div class="flex items-center gap-2">
		<FieldLabel for={field.name}>
			{field.label}{#if field.required}<span class="text-destructive"> *</span>{/if}
		</FieldLabel>
		<Switch
			id={field.name}
			name={field.name}
			{checked}
			{disabled}
			required={field.required}
			aria-invalid={Boolean(error)}
			aria-describedby={error ? `${field.name}-error` : undefined}
			{onCheckedChange}
		/>
	</div>
	{#if field.description}<FieldDescription>{field.description}</FieldDescription>{/if}
	{#if error}<FieldError id={`${field.name}-error`}>{error}</FieldError>{/if}
</Field>
