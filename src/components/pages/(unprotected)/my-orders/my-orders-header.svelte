<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import FilterBar from '@/components/ui/custom-components/filter-bar/filter-bar.svelte';

	// TYPES
	import type { FiltersApi } from '@/shared/features/filters/types/filterTypes.js';

	let { authenticated, filters }: { authenticated: boolean; filters: FiltersApi } = $props();
</script>

<header class="flex flex-col gap-6">
	<div class="flex max-w-2xl flex-col gap-3">
		<p class="text-sm font-medium text-primary">{m['MyOrdersPage.MyOrdersHeader.eyebrow']()}</p>
		<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
			{m['MyOrdersPage.MyOrdersHeader.heading']()}
		</h1>
		<p class="text-pretty text-muted-foreground">
			{authenticated
				? m['MyOrdersPage.MyOrdersHeader.signedInDescription']()
				: m['MyOrdersPage.MyOrdersHeader.guestDescription']()}
		</p>
	</div>

	<FilterBar
		{filters}
		idPrefix="my-orders"
		clearLabel={m['MyOrdersPage.clearFilters']({ count: filters.count })}
	/>
</header>
