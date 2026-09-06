<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';

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

	<Field.Group class="flex-row flex-wrap items-end gap-3">
		{#each filters.defs as def (def.key)}
			<Field.Field class="w-auto min-w-40 flex-1 gap-2 sm:flex-none">
				<Field.Label for={`admin-orders-${def.key}`}>{def.label}</Field.Label>
				<NativeSelect
					id={`admin-orders-${def.key}`}
					options={def.options}
					value={filters.value(def.key)}
					placeholder={def.label}
					label={def.label}
					onchange={(value) => filters.set(def.key, value)}
					class="min-w-40"
				/>
			</Field.Field>
		{/each}
		{#if filters.isActive}
			<Button type="button" variant="outline" size="sm" onclick={filters.clearAll}>
				{m['AdminOrdersPage.clearFilters']({ count: filters.count })}
			</Button>
		{/if}
	</Field.Group>
</header>
