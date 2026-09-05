<script lang="ts">
	// HOOKS
	import { useSearchParams } from '@/hooks/useSearchParams.svelte';

	// TYPES
	import type { ComponentProps, Snippet } from 'svelte';

	import * as Tabs from '@/components/ui/tabs/index.js';

	type RootProps = ComponentProps<typeof Tabs.Root>;
	type Props = Omit<RootProps, 'children' | 'value' | 'onValueChange'> & {
		children: Snippet<[string]>;
		param?: string;
		defaultValue?: string;
		onValueChange?: RootProps['onValueChange'];
	};

	let { children, param = 'tab', defaultValue = '', onValueChange, ...restProps }: Props = $props();

	const { read, write } = useSearchParams(() => [param], { history: 'push' });
	let activeValue = $derived(read(param) || defaultValue);

	function handleValueChange(value: string): void {
		activeValue = value;
		write({ [param]: value });
		onValueChange?.(value);
	}
</script>

<Tabs.Root bind:value={activeValue} onValueChange={handleValueChange} {...restProps}>
	{@render children(activeValue)}
</Tabs.Root>
