<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div role="status" aria-label={m['ShopPage.loadingProducts']()}>
	<div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
		{#each Array(12)}
			<div class="flex flex-col gap-4">
				<Skeleton class="aspect-3/4 w-full rounded-sm" />
				<div class="flex flex-col gap-3">
					<Skeleton class="h-6 w-3/4" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-2/3" />
					<Skeleton class="mt-2 h-10 w-full rounded-full" />
				</div>
			</div>
		{/each}
	</div>
</div>
