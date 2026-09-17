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

{#snippet label()}
	{#if field.label}
		<FieldLabel for={field.name}>
			{field.label}{#if field.required}<span class="text-destructive"> *</span>{/if}
		</FieldLabel>
	{/if}
{/snippet}

{#snippet description()}
	{#if field.description}<FieldDescription>{field.description}</FieldDescription>{/if}
	{#if error}<FieldError id={`${field.name}-error`}>{error}</FieldError>{/if}
{/snippet}

<Field
	orientation={labelPosition === 'after' ? 'horizontal' : 'vertical'}
	class={cn(labelPosition === 'after' && 'gap-2', field.class, className)}
	data-disabled={disabled}
	data-invalid={Boolean(error)}
>
	{#if labelPosition === 'after'}
		{@render children?.()}
		<FieldContent>
			{@render label()}
			{@render description()}
		</FieldContent>
	{:else}
		{@render label()}
		<FieldContent>
			{@render children?.()}
			{@render description()}
		</FieldContent>
	{/if}
</Field>
