<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-3">
	{#each Array(5)}
		<article
			class="flex min-w-0 flex-col gap-4 rounded-4xl bg-card p-4 text-sm shadow-md ring-1 ring-foreground/5 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
		>
			<div class="flex min-w-0 flex-1 flex-col gap-3">
				<div class="flex min-w-0 flex-wrap items-center gap-2">
					<Skeleton class="h-5 w-16" />
					<Skeleton class="h-4 w-40 max-w-full" />
				</div>
				<Skeleton class="h-3 w-48 max-w-full" />
				<div class="flex flex-wrap gap-4">
					<Skeleton class="h-3 w-28" />
					<Skeleton class="h-3 w-20" />
					<Skeleton class="h-3 w-56 max-w-full" />
				</div>
			</div>

			<div class="flex flex-wrap gap-1 sm:max-w-xs sm:justify-end">
				<Skeleton class="h-5 w-16" />
				<Skeleton class="h-5 w-20" />
			</div>
		</article>
	{/each}
</div>
