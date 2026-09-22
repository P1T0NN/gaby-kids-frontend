<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	const STAT_SKELETONS = [0, 1, 2];
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
	{#each STAT_SKELETONS as skeleton (skeleton)}
		<Skeleton class="h-40 rounded-4xl" />
	{/each}
</div>
