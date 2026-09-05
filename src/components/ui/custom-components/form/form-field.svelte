<script lang="ts">
	// COMPONENTS
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldError,
		FieldLabel
	} from '@/components/ui/field/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { BaseField } from './formTypes.js';

	type Props = {
		field: BaseField;
		disabled?: boolean;
		error?: string;
		labelPosition?: 'before' | 'after';
		class?: string;
		children?: Snippet;
	};

	let {
		field,
		disabled = false,
		error,
		labelPosition = 'before',
		class: className,
		children
	}: Props = $props();
</script>

<Field
	class={cn(labelPosition === 'after' && 'flex-row items-center gap-2', field.class, className)}
	data-disabled={disabled}
	data-invalid={Boolean(error)}
>
	{#if labelPosition === 'before' && field.label}
		<FieldLabel for={field.name}>
			{field.label}{#if field.required}<span class="text-destructive"> *</span>{/if}
		</FieldLabel>
	{/if}

	<FieldContent>
		{@render children?.()}
		{#if field.description}<FieldDescription>{field.description}</FieldDescription>{/if}
		{#if error}<FieldError id={`${field.name}-error`}>{error}</FieldError>{/if}
	</FieldContent>

	{#if labelPosition === 'after' && field.label}
		<FieldLabel for={field.name}>
			{field.label}{#if field.required}<span class="text-destructive"> *</span>{/if}
		</FieldLabel>
	{/if}
</Field>
