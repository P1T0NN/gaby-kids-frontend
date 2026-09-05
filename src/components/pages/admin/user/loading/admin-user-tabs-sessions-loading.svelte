<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton';
</script>

<div class="flex flex-col gap-3">
	{#each Array(5)}
		<article
			class="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5"
		>
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
				<Skeleton class="h-5 w-14" />
				<Skeleton class="h-3.5 w-24" />
				<Skeleton class="h-3.5 w-28" />
				<Skeleton class="h-3.5 min-w-40 flex-1" />
			</div>

			<div class="grid gap-x-4 gap-y-1.5 border-t border-border pt-2 sm:grid-cols-3">
				<Skeleton class="h-3.5 w-24" />
				<Skeleton class="h-3.5 w-28" />
				<Skeleton class="h-3.5 w-24" />
			</div>
		</article>
	{/each}
</div>
