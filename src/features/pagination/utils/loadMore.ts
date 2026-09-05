// UTILS
import { applyInfinitePage } from '@/features/pagination/utils/applyInfinitePage.js';

// TYPES
import type { LoadMorePaginationOptions } from '@/features/pagination/types/convexPaginationTypes.js';

/** Commit the current page and request the next server cursor. */
export function loadMore<Item>(options: LoadMorePaginationOptions<Item>): void {
	const cannotRequestNextPage =
		!options.queryEnabled ||
		(options.loadingMore && options.currentPage === undefined) ||
		options.retrying ||
		!options.visibleHasNextPage;
	if (cannotRequestNextPage) return;

	// The first page is derived before the session is promoted. A fresh page
	// is sufficient to promote it when the sentinel asks for page two.
	const isWaitingForFirstPage = !options.isCurrentSession && options.currentPage === undefined;
	if (isWaitingForFirstPage) return;

	let session = options.getSession();
	if (session.key !== options.resetKey) {
		options.setSession(options.createSession(options.resetKey));
		session = options.getSession();
	}

	if (options.currentPage !== undefined) {
		applyInfinitePage(session, options.currentPage, options.queryKey, options.getItemKey);
	}
	if (!session.initialized) return;

	const nextCursor = session.nextCursor;
	const hasNoNewCursor = nextCursor === null || nextCursor === session.cursor;
	if (hasNoNewCursor) {
		session.hasNextPage = false;
		return;
	}

	session.cursor = nextCursor;
	session.loadingMore = true;
}
