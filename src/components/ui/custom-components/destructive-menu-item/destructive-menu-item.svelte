<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	let {
		label,
		disabled = false,
		onclick
	}: { label: string; disabled?: boolean; onclick: () => void } = $props();
</script>

<Button
	type="button"
	variant="ghost"
	size="sm"
	class="w-full justify-start rounded-xl px-3 py-2 font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
	{onclick}
	{disabled}
>
	<span class="icon-[lucide--trash-2] size-4" aria-hidden="true"></span>
	{label}
</Button>
