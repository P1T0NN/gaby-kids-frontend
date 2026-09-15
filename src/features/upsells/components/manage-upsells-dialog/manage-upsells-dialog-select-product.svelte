<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// COMPONENTS
	import { Spinner } from '@/components/ui/spinner/index.js';
	import SearchInput from '@/features/search/components/search-input.svelte';

	// TRANSLATIONS
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useSearch } from '@/features/search/hooks/useSearch.svelte.js';

	// UTILS
	import { formatPrice } from '@/shared/utils/pricing.js';

	// TYPES
	import type { Doc, Id } from '@convex/_generated/dataModel.js';

	let {
		onSelect,
		label = m['UpsellsFeature.ManageUpsellsDialogSelectProduct.productLabel'](),
		placeholder = m['UpsellsFeature.ManageUpsellsDialogSelectProduct.searchPlaceholder'](),
		excludedProductIds = [],
		activeOnly = false
	}: {
		onSelect: (product: Doc<'products'>) => void;
		label?: string;
		placeholder?: string;
		excludedProductIds?: Id<'products'>[];
		activeOnly?: boolean;
	} = $props();

	const componentId = $props.id();
	const searchInputId = `${componentId}-product-search`;
	const search = useSearch({ mode: 'state' });
	const products = useQuery(
		api.tables.products.queries.fetchProductsSearch.fetchProductsSearch,
		() => (search.isActive ? { search: search.term } : 'skip')
	);
	const availableProducts = $derived(
		(products.data ?? []).filter(
			(product) =>
				(!activeOnly || product.status === 'active') && !excludedProductIds.includes(product._id)
		)
	);

	function selectProduct(product: Doc<'products'>): void {
		if ((activeOnly && product.status !== 'active') || excludedProductIds.includes(product._id))
			return;
		onSelect(product);
		search.clear();
	}
</script>

<div class="flex flex-col gap-2">
	<label for={searchInputId} class="text-sm font-medium">
		{label}
	</label>
	<SearchInput
		id={searchInputId}
		bind:value={search.value}
		{label}
		{placeholder}
		dropdownOpen={search.isActive}
		autofocus
	>
		{#snippet dropdown()}
			{#if products.isLoading}
				<div class="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
					<Spinner />
					{m['UpsellsFeature.ManageUpsellsDialogSelectProduct.loading']()}
				</div>
			{:else if products.error}
				<p class="px-3 py-2 text-sm text-destructive" role="alert">
					{m['UpsellsFeature.ManageUpsellsDialogSelectProduct.searchError']()}
				</p>
			{:else}
				{#each availableProducts as product (product._id)}
					<button
						type="button"
						role="option"
						aria-selected="false"
						class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
						onclick={() => selectProduct(product)}
					>
						{#if product.images[0]}
							<img
								src={product.images[0]}
								alt=""
								width="40"
								height="40"
								loading="lazy"
								class="size-10 shrink-0 rounded-md object-cover"
							/>
						{:else}
							<span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
								<span class="icon-[lucide--package] size-4 text-muted-foreground" aria-hidden="true"
								></span>
							</span>
						{/if}
						<span class="min-w-0">
							<span class="block truncate text-sm font-medium">{product.name}</span>
							<span class="block text-xs text-muted-foreground">
								{formatPrice(product.priceInCents)}
							</span>
						</span>
					</button>
				{:else}
					<p class="px-3 py-2 text-sm text-muted-foreground">
						{m['UpsellsFeature.ManageUpsellsDialogSelectProduct.noMatches']()}
					</p>
				{/each}
			{/if}
		{/snippet}
	</SearchInput>
</div>
