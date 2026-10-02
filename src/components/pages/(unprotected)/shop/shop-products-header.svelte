<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import * as Breadcrumb from '@/components/ui/breadcrumb/index.js';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import SearchInput from '@/features/search/components/search-input.svelte';

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

	const filtered = $derived(search.isActive || filters.isFiltering);
	const countLabel = $derived(
		total == null
			? ''
			: total === 1
				? m['ShopPage.productCountOne']({ count: total })
				: m['ShopPage.productCount']({ count: total })
	);
</script>

<header class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
	<div class="flex flex-col gap-2.5">
		<Breadcrumb.Breadcrumb>
			<Breadcrumb.BreadcrumbList>
				<Breadcrumb.BreadcrumbItem>
					<Link
						href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}
						class="transition-colors hover:text-foreground"
					>
						{m['Components.Header.home']()}
					</Link>
				</Breadcrumb.BreadcrumbItem>
				<Breadcrumb.BreadcrumbSeparator />
				<Breadcrumb.BreadcrumbItem>
					<Breadcrumb.BreadcrumbPage>{m['ShopPage.pageTitle']()}</Breadcrumb.BreadcrumbPage>
				</Breadcrumb.BreadcrumbItem>
			</Breadcrumb.BreadcrumbList>
		</Breadcrumb.Breadcrumb>

		<div
			class="flex flex-wrap items-baseline gap-x-4 gap-y-1"
			aria-live="polite"
			aria-atomic="true"
		>
			<h1 class="font-serif text-4xl sm:text-5xl">{m['ShopPage.pageTitle']()}</h1>
			<p class="text-sm text-muted-foreground">
				{#if filtered}
					{m['ShopPage.filtered']()}
				{:else if error}
					<span aria-hidden="true">?</span>
					{m['ShopPage.found']()}
				{:else if total != null}
					{countLabel}
				{:else if loading}
					<Spinner class="self-center" aria-label={m['ShopPage.loadingCount']()} />
				{/if}
			</p>
		</div>
	</div>

	<SearchInput
		bind:value={search.value}
		label={m['ShopPage.searchLabel']()}
		placeholder={m['ShopPage.searchPlaceholder']()}
		class="lg:w-115 lg:shrink-0"
		groupClass="h-13 rounded-full bg-secondary px-1"
	/>
</header>
