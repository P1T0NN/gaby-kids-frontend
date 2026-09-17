<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';

	// TYPES
	import type { FiltersApi } from '@/shared/features/filters/types/filterTypes.js';

	let {
		filters,
		idPrefix,
		clearLabel
	}: {
		filters: FiltersApi;
		/** Prefix for the generated field ids, e.g. `my-orders`. */
		idPrefix: string;
		/** Copy for the clear button (page-owned; usually includes the active count). */
		clearLabel: string;
	} = $props();
</script>

<Field.Group class="flex-row flex-wrap items-end gap-3">
	{#each filters.defs as def (def.key)}
		<Field.Field class="w-auto min-w-40 flex-1 gap-2 sm:flex-none">
			<Field.Label for={`${idPrefix}-${def.key}`}>{def.label}</Field.Label>
			<NativeSelect
				id={`${idPrefix}-${def.key}`}
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
			{clearLabel}
		</Button>
	{/if}
</Field.Group>
