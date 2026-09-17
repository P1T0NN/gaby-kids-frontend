<script lang="ts">
	// COMPONENTS
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';

	// TYPES
	import type { EmptyDataAction } from '@/components/ui/custom-components/empty-data/emptyDataTypes.js';

	let {
		title,
		description,
		action
	}: {
		title?: string;
		description?: string;
		action?: EmptyDataAction;
	} = $props();
</script>

<EmptyData {title} {description} {action}>
	{#snippet icon()}
		<span class="icon-[lucide--inbox] size-5" aria-hidden="true"></span>
	{/snippet}
</EmptyData>
