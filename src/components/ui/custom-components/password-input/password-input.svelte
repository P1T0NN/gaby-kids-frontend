<script lang="ts">
	import * as InputGroup from '@/components/ui/input-group/index.js';
	import { m } from '@/lib/paraglide/messages';
	import type { ComponentProps } from 'svelte';

	type Props = Omit<ComponentProps<typeof InputGroup.Input>, 'type' | 'value' | 'files'> & {
		value?: string;
	};

	let {
		value = $bindable(''),
		ref = $bindable(null),
		placeholder = '********',
		disabled = false,
		class: className,
		...restProps
	}: Props = $props();

	let passwordVisible = $state(false);
</script>

<InputGroup.Root class={className}>
	<InputGroup.Input
		bind:ref
		bind:value
		type={passwordVisible ? 'text' : 'password'}
		{placeholder}
		{disabled}
		{...restProps}
	/>

	<InputGroup.Addon align="inline-end">
		<InputGroup.Button
			type="button"
			size="icon-xs"
			aria-label={passwordVisible
				? m['Components.PasswordInput.hidePassword']()
				: m['Components.PasswordInput.showPassword']()}
			aria-pressed={passwordVisible}
			{disabled}
			onclick={() => (passwordVisible = !passwordVisible)}
		>
			{#if passwordVisible}
				<span class="icon-[lucide--eye-off] size-4" aria-hidden="true"></span>
			{:else}
				<span class="icon-[lucide--eye] size-4" aria-hidden="true"></span>
			{/if}
		</InputGroup.Button>
	</InputGroup.Addon>
</InputGroup.Root>
