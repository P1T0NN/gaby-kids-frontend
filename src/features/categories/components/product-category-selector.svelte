<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';
	import { untrack } from 'svelte';

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
		selectedId = $bindable(''),
		initialCategory,
		required = false,
		disabled = false
	}: {
		id?: string;
		selectedId?: string;
		initialCategory?: CategoryOption;
		required?: boolean;
		disabled?: boolean;
	} = $props();

	const search = useSearch({ mode: 'state' });
	const categories = useQuery(
		api.tables.categories.queries.fetchCategoriesSearch.fetchCategoriesSearch,
		() => (search.isActive ? { search: search.term } : 'skip')
	);

	const initial = untrack(() => initialCategory);
	let selectedCategoryName = $state(initial?.name ?? '');

	if (initial) {
		search.value = initial.name;
	}

	const dropdownOpen = $derived(search.isActive && search.value !== selectedCategoryName);

	function selectCategory(category: CategoryOption): void {
		if (disabled || category.status === 'archived') return;

		selectedId = String(category._id);
		selectedCategoryName = category.name;
		search.value = category.name;
	}

	function handleInput(event: Event): void {
		// SAFETY: SearchInput forwards the native input event from its underlying input.
		const value = (event.currentTarget as HTMLInputElement).value;
		if (value !== selectedCategoryName) {
			selectedId = '';
			selectedCategoryName = '';
		}
	}

	function clearSelection(): void {
		selectedId = '';
		selectedCategoryName = '';
		search.clear();
	}
</script>

<SearchInput
	{id}
	bind:value={search.value}
	label={m['AddProductPage.ProductCategorySelector.searchLabel']()}
	placeholder={m['AddProductPage.ProductCategorySelector.searchPlaceholder']()}
	{disabled}
	{required}
	{dropdownOpen}
	oninput={handleInput}
	onclear={clearSelection}
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
					aria-selected={selectedId === String(category._id)}
					disabled={disabled || category.status === 'archived'}
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
