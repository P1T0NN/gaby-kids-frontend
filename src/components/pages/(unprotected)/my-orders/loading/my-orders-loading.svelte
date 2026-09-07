<script lang="ts">
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col" aria-hidden="true">
	{#each Array(3) as _, index (index)}
		<div
			class="grid gap-5 border-b py-6 first:pt-0 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"
		>
			<div class="space-y-3">
				<div class="flex gap-2"><Skeleton class="h-7 w-28" /><Skeleton class="h-6 w-24" /></div>
				<Skeleton class="h-4 w-64 max-w-full" />
			</div>
			<Skeleton class="h-9 w-28" />
		</div>
	{/each}
</div>
