<script lang="ts" generics="T">
	// COMPONENTS
	import PaginatedData from '@/components/ui/custom-components/paginated-data/paginated-data.svelte';

	// TYPES
	import type { PaginationState } from '@/shared/features/pagination/types/paginationTypes.js';

	let {
		pagination,
		total
	}: {
		/** Cursor pagination state from `useConvexPagination`. */
		pagination: PaginationState<T>;
		/** Overrides `pagination.total` when the caller knows a better total. */
		total?: number | null;
	} = $props();
</script>

<PaginatedData
	page={pagination.page}
	nextCursor={pagination.nextCursor}
	total={total !== undefined ? total : pagination.total}
	pageSize={pagination.pageSize}
	loading={pagination.loading}
	onPrev={pagination.onPrev}
	onNext={pagination.onNext}
/>
