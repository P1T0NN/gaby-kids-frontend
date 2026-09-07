<script lang="ts">
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="space-y-7" aria-hidden="true">
	<div class="space-y-3 border-b pb-7">
		<Skeleton class="h-5 w-24" /><Skeleton class="h-10 w-44" />
	</div>
	{#each Array(2) as _, index (index)}
		<div class="rounded-xl border p-6">
			<Skeleton class="mb-6 h-6 w-32" /><Skeleton class="h-28 w-full" />
		</div>
	{/each}
</div>
