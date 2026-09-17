<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import Spinner from '@/components/ui/spinner/spinner.svelte';
	import CategoryOptions from '@/features/categories/components/category-options/category-options.svelte';
	import SearchInput from '@/features/search/components/search-input.svelte';

	// CONFIG
	import { SHOP_CATEGORY_FILTER_KEY } from '@/shared/features/filters/data/shopCategoryFilter.js';

	// TYPES
	import type { SearchApi } from '@/features/search/types/searchTypes.js';
	import type { FiltersApi } from '@/shared/features/filters/types/filterTypes.js';

	let {
		total,
		loading,
		error,
		search,
		filters
	}: {
		total?: number;
		loading: boolean;
		error: unknown;
		search: SearchApi;
		filters: FiltersApi;
	} = $props();

	const filtered = $derived(search.isActive || filters.isActive);

	function clearFilters(): void {
		search.clear();
		filters.clearAll();
	}
</script>

<header class="flex flex-col gap-6">
	<h1
		class="flex flex-wrap items-baseline gap-x-2 text-2xl font-semibold tracking-tight sm:text-3xl"
		aria-live="polite"
		aria-atomic="true"
	>
		{m['ShopPage.products']()}
		<span class="text-muted-foreground">-</span>
		<span class="inline-flex items-baseline gap-2 text-lg font-normal text-muted-foreground">
			{#if filtered}
				{m['ShopPage.filtered']()}
			{:else if error}
				<span aria-hidden="true">?</span> {m['ShopPage.found']()}
			{:else}
				{#if total != null}
					<span class="tabular-nums">{total}</span>
				{:else if loading}
					<Spinner class="self-center" aria-label={m['ShopPage.loadingCount']()} />
				{/if}
				{m['ShopPage.found']()}
			{/if}
		</span>
	</h1>

	<div class="flex flex-col gap-4 border-b pb-6">
		<SearchInput
			bind:value={search.value}
			label={m['ShopPage.searchLabel']()}
			placeholder={m['ShopPage.searchPlaceholder']()}
			class="sm:max-w-md"
		/>
		<Field.Group class="flex-row flex-wrap items-end gap-3">
			{#each filters.defs as def (def.key)}
				<Field.Field class="w-auto min-w-40 flex-1 gap-2 sm:flex-none">
					<Field.Label for={`shop-${def.key}`}>{def.label}</Field.Label>
					{#if def.key === SHOP_CATEGORY_FILTER_KEY}
						<CategoryOptions
							id={`shop-${def.key}`}
							label={def.label}
							class="min-w-40"
							categoryValue={filters.value(def.key)}
							onCategoryChange={(value) => filters.set(def.key, value)}
						/>
					{:else}
						<NativeSelect
							id={`shop-${def.key}`}
							label={def.label}
							options={def.options}
							value={filters.value(def.key)}
							onchange={(value) => filters.set(def.key, value)}
							class="min-w-40"
						/>
					{/if}
				</Field.Field>
			{/each}
			<Button
				type="button"
				variant="ghost"
				disabled={!filtered && !search.value}
				onclick={clearFilters}
			>
				{m['ShopPage.clearFilters']()}
			</Button>
		</Field.Group>
	</div>
</header>
