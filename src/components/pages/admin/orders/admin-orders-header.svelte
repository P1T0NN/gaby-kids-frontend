<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import FilterBar from '@/components/ui/custom-components/filter-bar/filter-bar.svelte';

	// TYPES
	import type { FiltersApi } from '@/shared/features/filters/types/filterTypes.js';

	let { filters }: { filters: FiltersApi } = $props();
</script>

<header class="flex flex-col gap-4">
	<div class="flex flex-col gap-1">
		<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
			{m['AdminOrdersPage.AdminOrdersHeader.adminLabel']()}
		</p>
		<h1 class="text-2xl font-semibold tracking-tight">
			{m['AdminOrdersPage.AdminOrdersHeader.heading']()}
		</h1>
		<p class="text-sm text-muted-foreground">
			{m['AdminOrdersPage.AdminOrdersHeader.description']()}
		</p>
	</div>

	<FilterBar
		{filters}
		idPrefix="admin-orders"
		clearLabel={m['AdminOrdersPage.clearFilters']({ count: filters.count })}
	/>
</header>
