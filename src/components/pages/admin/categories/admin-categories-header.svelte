<script lang="ts">
	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import { m } from '@/lib/paraglide/messages';

	let { total, showTotal = true }: { total?: number | null; showTotal?: boolean } = $props();
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div class="flex flex-col gap-1">
		<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
			{m['AdminCategoriesPage.AdminCategoriesHeader.adminLabel']()}
		</p>
		<h1 class="text-2xl font-semibold tracking-tight">
			{#if showTotal && total != null}
				{m['AdminCategoriesPage.AdminCategoriesHeader.categoriesFound']({ count: total })}
			{:else if showTotal}
				{m['AdminCategoriesPage.AdminCategoriesHeader.categoriesLabel']()}
			{:else}
				{m['AdminCategoriesPage.AdminCategoriesHeader.filteredLabel']()}
			{/if}
		</h1>
		<p class="text-sm text-muted-foreground">
			{m['AdminCategoriesPage.AdminCategoriesHeader.description']()}
		</p>
	</div>

	<ButtonLink href={ADMIN_PAGE_ENDPOINTS.ADD_CATEGORY}>
		<span class="icon-[lucide--plus] size-4" data-icon="inline-start"></span>
		{m['AdminCategoriesPage.AdminCategoriesHeader.addCategory']()}
	</ButtonLink>
</div>
