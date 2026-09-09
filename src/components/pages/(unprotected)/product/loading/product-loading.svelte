<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div role="status" aria-label={m['ProductPage.ProductLoading.loading']()}>
	<span class="sr-only">{m['ProductPage.ProductLoading.loading']()}</span>
	<div
		aria-hidden="true"
		class="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-8 xl:gap-x-20"
	>
		<div class="flex flex-col gap-4 lg:col-start-2 lg:row-start-1 lg:pt-3">
			<Skeleton class="h-10 w-4/5" />
			<Skeleton class="h-8 w-28" />
		</div>
		<Skeleton class="aspect-square w-full lg:col-start-1 lg:row-span-2 lg:row-start-1" />
		<div class="flex flex-col gap-8 lg:col-start-2 lg:row-start-2">
			<Skeleton class="h-14 w-full" />
			<div class="flex flex-col gap-3">
				<Skeleton class="h-5 w-36" />
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-4 w-3/4" />
			</div>
		</div>
	</div>
</div>
