<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div role="status" aria-label={m['ShopPage.loadingProducts']()}>
	<div
		class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
		aria-hidden="true"
	>
		{#each Array(12)}
			<div class="flex flex-col gap-4">
				<Skeleton class="aspect-square w-full rounded-4xl" />
				<div class="flex flex-col gap-3 px-4">
					<Skeleton class="h-5 w-3/4" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-2/3" />
					<Skeleton class="mt-2 h-10 w-full rounded-full" />
				</div>
			</div>
		{/each}
	</div>
</div>
