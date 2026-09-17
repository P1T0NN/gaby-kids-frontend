<script lang="ts" generics="T">
	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Table, TableHeader, TableBody, TableRow, TableHead } from '@/components/ui/table';
	import DataEmptyState from '@/components/ui/custom-components/data-empty-state/data-empty-state.svelte';
	import DataPagination from '@/components/ui/custom-components/data-pagination/data-pagination.svelte';
	import DataTableItem from './data-table-item.svelte';
	import DataTableItemsLoading from './data-table-items-loading.svelte';
	import DataTableSelectionBar from './data-table-selection-bar.svelte';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useSelectable } from '@/hooks/useSelectable.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { DataTableProps } from '@/components/ui/custom-components/data-table/dataTableTypes.js';

	let {
		pagination,
		total,
		placement = 'below',
		header,
		head: headSnippet,
		row,
		selectable = false,
		borderless = false,
		loadingSnippet,
		errorSnippet,
		empty,
		emptyTitle = m['Components.DataTable.emptyTitle'](),
		emptyDescription = m['Components.DataTable.emptyDescription'](),
		emptyAction,
		key,
		actions,
		class: className
	}: DataTableProps<T> = $props();

	// Selection state lives in the shared hook (hooks/useSelectable) so any
	// future list/table harness gets it for free. `key` is passed as a getter
	// so a changing prop stays reactive; the row UI + click behavior live in
	// DataTableItem, which receives the hook as a single `selection` prop.
	const selection = useSelectable(() => key);

	// live count of checked rows — drives the selection bar below
	const selectionCount = $derived(selection.selectedKeys.size);

	// First load: the header shell renders alone with the loading card right
	// below it, so its bottom corners stay straight and it keeps no bottom
	// margin — the loading card owns the rounded bottom.
	const isFirstLoad = $derived(pagination.loading && pagination.data.length === 0);
</script>

{#if header}
	{@render header()}
{/if}
{#if placement === 'above' && pagination.data.length > 0}
	<DataPagination {pagination} {total} />
{/if}
{#if pagination.error && pagination.data.length === 0}
	{@render errorSnippet?.(pagination.error)}
{:else if pagination.data.length > 0 || (pagination.loading && headSnippet)}
	{#if selectionCount > 0}
		<DataTableSelectionBar
			count={selectionCount}
			selectedKeys={selection.selectedKeys}
			onClear={selection.clear}
			{actions}
		/>
	{/if}
	{#snippet table()}
		<Table
			class={cn(
				// Keep the primary column flexible while metadata and action columns stay compact.
				'[&_td:not(:first-child)]:w-px [&_th:not(:first-child)]:w-px',
				'[&_td]:px-4 [&_th]:px-4',
				className
			)}
		>
			{#if headSnippet}
				<TableHeader>
					<TableRow>
						{#if selectable}
							<TableHead class="w-10"></TableHead>
						{/if}
						{@render headSnippet()}
					</TableRow>
				</TableHeader>
			{/if}
			{#if pagination.data.length > 0 && !pagination.loading}
				<TableBody>
					{#each pagination.data as item, i (key ? key(item) : i)}
						<DataTableItem {item} index={i} {selectable} {selection} {row} />
					{/each}
				</TableBody>
			{/if}
		</Table>
	{/snippet}

	{#if borderless}
		<div class={cn(placement === 'above' && 'mt-3', placement === 'below' && 'mb-3')}>
			{@render table()}
		</div>
	{:else}
		<Card
			class={cn(
				'overflow-hidden pt-0',
				isFirstLoad && 'rounded-none rounded-t-4xl',
				placement === 'above' && 'mt-3',
				placement === 'below' && !isFirstLoad && 'mb-3'
			)}
		>
			{@render table()}
		</Card>
	{/if}
	{#if pagination.loading}
		{#if loadingSnippet}
			{@render loadingSnippet()}
		{:else}
			<DataTableItemsLoading {borderless} />
		{/if}
	{/if}
{:else if pagination.loading}
	{#if loadingSnippet}
		{@render loadingSnippet()}
	{:else}
		<DataTableItemsLoading {borderless} />
	{/if}
{:else if empty}
	{@render empty()}
{:else}
	<DataEmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
{/if}
{#if placement === 'below' && pagination.data.length > 0}
	<DataPagination {pagination} {total} />
{/if}
