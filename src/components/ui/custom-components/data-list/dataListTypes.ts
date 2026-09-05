import type { Snippet } from 'svelte';

import type { PaginationPlacement } from '@/components/ui/custom-components/paginated-data/types.js';
import type { EmptyDataAction } from '@/components/ui/custom-components/empty-data/emptyDataTypes.js';
import type {
	InfinitePaginationState,
	PaginationState
} from '@/shared/features/pagination/types/paginationTypes.js';

type DataListCommonProps<T> = {
	total?: number | null;
	placement?: PaginationPlacement;
	showPagination?: boolean;
	header?: Snippet;
	empty?: Snippet;
	emptyTitle?: string;
	emptyDescription?: string;
	emptyAction?: EmptyDataAction;
	loadingSnippet?: Snippet;
	errorSnippet?: Snippet<[error: unknown]>;
	key?: (item: T) => PropertyKey;
	class?: string;
	children: Snippet<[item: T, index: number]>;
};

export type DataListProps<T> = DataListCommonProps<T> &
	(
		| {
				infiniteScrolling?: false;
				pagination: PaginationState<T>;
		  }
		| {
				infiniteScrolling: true;
				pagination: InfinitePaginationState<T>;
		  }
	);
