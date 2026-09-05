<script lang="ts">
	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';
	import { m } from '@/lib/paraglide/messages';

	let { total, showTotal = true }: { total?: number | null; showTotal?: boolean } = $props();
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div class="flex flex-col gap-1">
		<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
			{m['AdminProductsPage.AdminProductsHeader.adminLabel']()}
		</p>
		<h1 class="text-2xl font-semibold tracking-tight">
			{#if showTotal}
				{#if total != null}
					{m['AdminProductsPage.AdminProductsHeader.productsFound']({ count: total })}
				{:else}
					<span class="inline-flex items-center gap-1">
						{m['AdminProductsPage.AdminProductsHeader.productsLabel']()} - <Spinner />
						{m['AdminProductsPage.AdminProductsHeader.foundLabel']()}
					</span>
				{/if}
			{:else}
				{m['AdminProductsPage.AdminProductsHeader.filteredLabel']()}
			{/if}
		</h1>
		<p class="text-sm text-muted-foreground">
			{m['AdminProductsPage.AdminProductsHeader.description']()}
		</p>
	</div>

	<Button href={ADMIN_PAGE_ENDPOINTS.ADD_PRODUCT}>
		<span class="icon-[lucide--plus] size-4" data-icon="inline-start"></span>
		{m['AdminProductsPage.AdminProductsHeader.addProduct']()}
	</Button>
</div>
