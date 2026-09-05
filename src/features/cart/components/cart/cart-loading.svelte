<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-4">
	{#each Array(2)}
		<div class="flex items-center gap-3">
			<Skeleton class="size-12 rounded-lg" />
			<div class="flex flex-1 flex-col gap-2">
				<Skeleton class="h-4 w-2/3" /><Skeleton class="h-3 w-1/3" />
			</div>
		</div>
	{/each}
</div>
