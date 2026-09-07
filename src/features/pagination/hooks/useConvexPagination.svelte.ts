// LIBRARIES
import type { FunctionReference } from 'convex/server';
import type { UseQueryReturn } from 'convex-svelte';

// BUILDERS
import { createConvexPaginationQuery } from '@/features/pagination/builders/createConvexPaginationQuery.svelte.js';

// CACHE
import { convexQueryCache } from '@/lib/clientCache/clientCache.js';

// TYPES
import type { PaginationState } from '@/shared/features/pagination/types/paginationTypes.js';
import type { ConvexPaginatedPage } from '@/shared/features/pagination/types/paginationTypesConvex.js';
import type {
	ConvexPaginationArgs,
	ConvexPaginationItem,
	ConvexPaginationOptions
} from '@/features/pagination/types/convexPaginationTypes.js';

type PaginationSession = {
	key: string | undefined;
	page: number;
	cursors: Record<number, string | null>;
};

function createPaginationSession(key: string | undefined): PaginationSession {
	return { key, page: 1, cursors: { 1: null } };
}

/** Keep one live Convex page subscription while hiding cursor plumbing from pages. */
export function useConvexPagination<Query extends FunctionReference<'query'>>(
	query: Query,
	args: ConvexPaginationArgs<Query>,
	options: ConvexPaginationOptions = {}
): PaginationState<ConvexPaginationItem<Query>> & { result: UseQueryReturn<Query> } {
	let session = $state(createPaginationSession(undefined));

	function getActiveSession(key: string): PaginationSession {
		return session.key === key ? session : createPaginationSession(key);
	}

	const queryState = createConvexPaginationQuery(query, args, {
		pageSize: options.pageSize,
		resetKey: options.resetKey,
		getCursor: (key) => {
			const active = getActiveSession(key);
			return active.cursors[active.page] ?? null;
		}
	});
	const resetKey = $derived(queryState.resetKey);
	// A new query identity derives a fresh page-one session; navigation promotes it to state.
	const activeSession = $derived.by(() => getActiveSession(resetKey));

	const cacheKey = $derived(`pagination:${queryState.queryKey}`);
	const result = queryState.result;
	const freshPage = $derived(queryState.freshPage);
	const cachedPage = $derived(
		// SAFETY: The function name and validated arguments uniquely identify the cached page type.
		convexQueryCache.get(cacheKey) as ConvexPaginatedPage<ConvexPaginationItem<Query>> | undefined
	);
	const current = $derived(freshPage ?? cachedPage);

	// Deliberate effect: this synchronizes fresh query results to an external LRU cache;
	// it does not derive Svelte state, and useQuery has no success callback for this write.
	$effect(() => {
		if (freshPage !== undefined) convexQueryCache.set(cacheKey, freshPage);
	});

	const data = $derived(current?.items ?? []);
	const nextCursor = $derived(current?.nextCursor ?? null);
	const pageSize = $derived(current?.pageSize);
	const total = $derived(current?.total);
	const totalPages = $derived(total != null && pageSize ? Math.ceil(total / pageSize) : undefined);

	function getMutableSession(): PaginationSession {
		if (session.key !== resetKey) session = createPaginationSession(resetKey);
		return session;
	}

	function onPrev(): void {
		if (activeSession.page <= 1) return;
		getMutableSession().page -= 1;
	}

	function onNext(): void {
		const isLastPage = totalPages !== undefined && activeSession.page >= totalPages;
		const cannotAdvance = nextCursor == null || isLastPage;
		if (cannotAdvance) return;
		const currentSession = getMutableSession();
		currentSession.cursors[currentSession.page + 1] = nextCursor;
		currentSession.page += 1;
	}

	return {
		get page() {
			return activeSession.page;
		},
		get data() {
			return data;
		},
		get loading() {
			return result.isLoading && cachedPage === undefined;
		},
		get error() {
			return result.error;
		},
		get nextCursor() {
			return nextCursor;
		},
		get pageSize() {
			return pageSize;
		},
		get total() {
			return total;
		},
		get result() {
			return result;
		},
		onPrev,
		onNext
	};
}
