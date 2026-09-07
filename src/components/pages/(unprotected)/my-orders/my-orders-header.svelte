<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';

	// TYPES
	import type { FiltersApi } from '@/shared/features/filters/types/filterTypes.js';

	let {
		authenticated,
		filters
	}: { authenticated: boolean; filters: FiltersApi } = $props();
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

	<Field.Group class="flex-row flex-wrap items-end gap-3">
		{#each filters.defs as def (def.key)}
			<Field.Field class="w-auto min-w-40 flex-1 gap-2 sm:flex-none">
				<Field.Label for={`my-orders-${def.key}`}>{def.label}</Field.Label>
				<NativeSelect
					id={`my-orders-${def.key}`}
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
				{m['MyOrdersPage.clearFilters']({ count: filters.count })}
			</Button>
		{/if}
	</Field.Group>
</header>
