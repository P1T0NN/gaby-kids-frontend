<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';
	import { untrack } from 'svelte';

	// CONFIG
	import { PRODUCTS_CONFIG } from '@/shared/features/products/config.js';

	// COMPONENTS
	import SearchInput from '@/features/search/components/search-input.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// HOOKS
	import { useSearch } from '@/features/search/hooks/useSearch.svelte.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel.js';

	type CategoryOption = Pick<Doc<'categories'>, '_id' | 'name' | 'slug' | 'status'>;

	let {
		id,
		selectedIds = $bindable([]),
		initialCategories = [],
		required = false,
		disabled = false,
		error = ''
	}: {
		id?: string;
		selectedIds?: string[];
		initialCategories?: CategoryOption[];
		required?: boolean;
		disabled?: boolean;
		/** Submit-time validation message; empty when the field is clean. */
		error?: string;
	} = $props();

	const search = useSearch({ mode: 'state' });
	const categories = useQuery(
		api.tables.categories.queries.fetchCategoriesSearch.fetchCategoriesSearch,
		() => (search.isActive ? { search: search.term } : 'skip')
	);

	let knownCategories = $state<CategoryOption[]>(untrack(() => [...initialCategories]));
	const selectedCategories = $derived(
		selectedIds.flatMap((id) => {
			const category = knownCategories.find((category) => category._id === id);
			return category ? [category] : [];
		})
	);
	const dropdownOpen = $derived(search.isActive);

	function selectCategory(category: CategoryOption): void {
		if (disabled) return;
		if (selectedIds.includes(category._id)) {
			selectedIds = selectedIds.filter((id) => id !== category._id);
			return;
		}
		const unavailable =
			category.status === 'archived' || selectedIds.length >= PRODUCTS_CONFIG.MAX_CATEGORIES;
		if (unavailable) return;
		if (!knownCategories.some((known) => known._id === category._id))
			knownCategories.push(category);
		selectedIds = [...selectedIds, category._id];
		search.clear();
	}
</script>

<SearchInput
	{id}
	bind:value={search.value}
	label={m['AddProductPage.ProductCategorySelector.searchLabel']()}
	placeholder={m['AddProductPage.ProductCategorySelector.searchPlaceholder']()}
	{disabled}
	required={required && selectedIds.length === 0}
	aria-invalid={error ? true : undefined}
	{dropdownOpen}
	dropdownMultiple
>
	{#snippet dropdown()}
		{#if categories.isLoading}
			<div class="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
				<Spinner />
				{m['AddProductPage.ProductCategorySelector.categoriesLoading']()}
			</div>
		{:else if categories.error}
			<p class="px-3 py-2 text-sm text-destructive" role="alert">
				{m['AddProductPage.ProductCategorySelector.searchError']()}
			</p>
		{:else}
			{#each categories.data ?? [] as category (category._id)}
				<button
					type="button"
					role="option"
					aria-selected={selectedIds.includes(category._id)}
					disabled={disabled ||
						(!selectedIds.includes(category._id) &&
							(category.status === 'archived' ||
								selectedIds.length >= PRODUCTS_CONFIG.MAX_CATEGORIES))}
					class="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
					onclick={() => selectCategory(category)}
				>
					<span class="truncate">{category.name}</span>
					{#if category.status === 'archived'}
						<span class="shrink-0 text-xs text-muted-foreground">
							{m['AddProductPage.ProductCategorySelector.archivedCategory']()}
						</span>
					{/if}
				</button>
			{:else}
				<p class="px-3 py-2 text-sm text-muted-foreground">
					{m['AddProductPage.ProductCategorySelector.noMatchingCategories']()}
				</p>
			{/each}
		{/if}
	{/snippet}
</SearchInput>

{#if selectedCategories.length > 0}
	<ul class="flex flex-wrap gap-2" aria-label={m['AddProductPage.categories']()}>
		{#each selectedCategories as category (category._id)}
			<li>
				<button
					type="button"
					{disabled}
					class="inline-flex min-h-9 items-center gap-2 rounded-md border px-3 py-1 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
					aria-label={m['AddProductPage.ProductCategorySelector.removeCategory']({
						name: category.name
					})}
					onclick={() => selectCategory(category)}
				>
					{category.name}
					{#if category.status === 'archived'}
						<span class="text-muted-foreground">
							({m['AddProductPage.ProductCategorySelector.archivedCategory']()})
						</span>
					{/if}
					<span class="icon-[lucide--x] size-3" aria-hidden="true"></span>
				</button>
			</li>
		{/each}
	</ul>
{/if}
