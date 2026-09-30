<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { SHOP_GENDER_FILTER_KEY } from '@/shared/features/filters/data/shopAttributeFilters.js';
	import { SHOP_CATEGORY_FILTER_KEY } from '@/shared/features/filters/data/shopCategoryFilter.js';

	// DATA
	import { getShopColorSwatchClass } from '@/features/filters/data/shopColorSwatches.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type {
		FilterDef,
		FilterOption,
		FiltersApi
	} from '@/shared/features/filters/types/filterTypes.js';

	let {
		filters,
		canClear,
		onClear
	}: {
		filters: FiltersApi;
		canClear: boolean;
		onClear: () => void;
	} = $props();

	const categoryOptionsQuery = useQuery(
		api.tables.categories.queries.fetchCategoryOptions.fetchCategoryOptions,
		{}
	);

	const categoryOptions = $derived<FilterOption[]>([
		{ value: '', label: m['CategoriesFeature.CategoryOptions.allCategories']() },
		...(categoryOptionsQuery.data ?? []).map((category) => ({
			value: category.slug,
			label: category.name
		}))
	]);

	const categoryDef = $derived(filters.defs.find((def) => def.key === SHOP_CATEGORY_FILTER_KEY));
	const allOptionLabel = m['ProductsFeature.ProductOptionFilterOptions.all']();

	// Sidebar order mirrors the design: gender, age, color, then any other filter.
	const GROUP_ORDER = [SHOP_GENDER_FILTER_KEY, 'age', 'color'];
	const orderIndex = (key: string) => {
		const index = GROUP_ORDER.indexOf(key);
		return index === -1 ? GROUP_ORDER.length : index;
	};
	const optionGroups = $derived(
		filters.defs
			.filter((def) => def.key !== SHOP_CATEGORY_FILTER_KEY)
			.sort((a, b) => orderIndex(a.key) - orderIndex(b.key))
	);

	const headingClass = 'text-xs font-semibold tracking-widest text-muted-foreground uppercase';
	const swatchSelectedClass = 'ring-2 ring-foreground ring-offset-2 ring-offset-background';

	function optionLabel(option: FilterOption): string {
		if (option.value === '') return allOptionLabel;
		return option.label;
	}

	function selectedOptionLabel(def: FilterDef): string {
		const selected = filters.value(def.key);
		if (!selected) return '';
		return def.options.find((option) => option.value === selected)?.label ?? '';
	}
</script>

<aside
	class="flex flex-col gap-9 lg:sticky lg:top-30 lg:max-h-[calc(100dvh-24rem)] lg:overflow-y-auto lg:px-1"
	aria-label={m['ShopPage.filters']()}
>
	<div class="flex items-baseline justify-between gap-4">
		<h2 class="font-serif text-2xl">{m['ShopPage.filters']()}</h2>
		{#if canClear}
			<button
				type="button"
				onclick={onClear}
				class="text-sm font-medium text-destructive underline underline-offset-4 transition-colors hover:text-foreground"
			>
				{m['ShopPage.clearFilters']()}
			</button>
		{/if}
	</div>

	{#if categoryDef}
		<section class="flex flex-col gap-3.5" aria-labelledby="shop-filter-category">
			<h3 id="shop-filter-category" class={headingClass}>{categoryDef.label}</h3>
			<div class="flex flex-col">
				{#each categoryOptions as option (option.value)}
					{@const isSelected = filters.value(categoryDef.key) === option.value}
					<button
						type="button"
						onclick={() => filters.set(categoryDef.key, option.value)}
						aria-pressed={isSelected}
						class={cn(
							'flex h-11 items-center gap-3 rounded-full px-4 text-left text-sm transition-colors hover:bg-secondary',
							isSelected && 'bg-secondary font-semibold'
						)}
					>
						<span
							class={cn(
								'flex size-4.5 shrink-0 items-center justify-center rounded-full border',
								isSelected ? 'border-accent' : 'border-foreground/30'
							)}
							aria-hidden="true"
						>
							<span class={cn('size-2 rounded-full', isSelected ? 'bg-accent' : 'bg-transparent')}
							></span>
						</span>
						<span class="truncate">{option.label}</span>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	{#each optionGroups as def (def.key)}
		<section class="flex flex-col gap-3.5" aria-labelledby={`shop-filter-${def.key}`}>
			{#if def.key === 'color'}
				<div class="flex items-baseline justify-between gap-3">
					<h3 id={`shop-filter-${def.key}`} class={headingClass}>{def.label}</h3>
					{#if selectedOptionLabel(def)}
						<p class="text-sm">{selectedOptionLabel(def)}</p>
					{/if}
				</div>
				<div class="flex flex-wrap items-center gap-3">
					{#each def.options as option (option.value)}
						{@const isSelected = filters.value(def.key) === option.value}
						{#if option.value === ''}
							<button
								type="button"
								onclick={() => filters.set(def.key, option.value)}
								title={allOptionLabel}
								aria-label={allOptionLabel}
								aria-pressed={isSelected}
								class={cn(
									'flex size-9 items-center justify-center rounded-full border border-foreground/20 text-muted-foreground transition-shadow hover:ring-2 hover:ring-ring/50',
									isSelected && swatchSelectedClass
								)}
							>
								<span class="icon-[lucide--slash] size-4" aria-hidden="true"></span>
							</button>
						{:else}
							<button
								type="button"
								onclick={() => filters.set(def.key, option.value)}
								title={option.label}
								aria-label={option.label}
								aria-pressed={isSelected}
								class={cn(
									'size-9 rounded-full border border-foreground/20 transition-shadow hover:ring-2 hover:ring-ring/50',
									getShopColorSwatchClass(option.value),
									isSelected && swatchSelectedClass
								)}
							></button>
						{/if}
					{/each}
				</div>
			{:else if def.key === 'age'}
				<div class="flex items-baseline justify-between gap-3">
					<h3 id={`shop-filter-${def.key}`} class={headingClass}>{def.label}</h3>
					<p class="text-xs text-muted-foreground">{m['ShopPage.ageUnits']()}</p>
				</div>
				<div class="grid grid-cols-6 gap-2">
					{#each def.options as option (option.value)}
						{@const isSelected = filters.value(def.key) === option.value}
						<button
							type="button"
							onclick={() => filters.set(def.key, option.value)}
							aria-pressed={isSelected}
							class={cn(
								'flex h-10 items-center justify-center rounded-full text-sm font-medium transition-colors',
								option.value === '' ? 'col-span-2' : 'aspect-square h-auto',
								isSelected
									? 'bg-accent text-accent-foreground'
									: 'bg-secondary text-foreground hover:ring-2 hover:ring-ring/50'
							)}
						>
							{optionLabel(option)}
						</button>
					{/each}
				</div>
			{:else if def.key === SHOP_GENDER_FILTER_KEY}
				<h3 id={`shop-filter-${def.key}`} class={headingClass}>{def.label}</h3>
				<div class="flex rounded-full bg-secondary p-1">
					{#each def.options as option (option.value)}
						{@const isSelected = filters.value(def.key) === option.value}
						<button
							type="button"
							onclick={() => filters.set(def.key, option.value)}
							aria-pressed={isSelected}
							class={cn(
								'h-10 min-w-0 flex-1 truncate rounded-full px-1 text-sm font-medium transition-colors',
								isSelected
									? 'bg-accent text-accent-foreground'
									: 'text-foreground hover:text-accent'
							)}
						>
							{optionLabel(option)}
						</button>
					{/each}
				</div>
			{:else}
				<h3 id={`shop-filter-${def.key}`} class={headingClass}>{def.label}</h3>
				<div class="flex flex-wrap gap-2">
					{#each def.options as option (option.value)}
						{@const isSelected = filters.value(def.key) === option.value}
						<button
							type="button"
							onclick={() => filters.set(def.key, option.value)}
							aria-pressed={isSelected}
							class={cn(
								'flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors',
								isSelected
									? 'border-accent bg-accent text-accent-foreground'
									: 'border-foreground/15 text-foreground hover:border-accent'
							)}
						>
							{optionLabel(option)}
						</button>
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</aside>
