// LIBRARIES
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

/** Shared cursor-list arguments: validated pagination, search, and symbolic filters. */
export const listPageArgs = {
	paginationOpts: paginationOptsValidator,
	search: v.optional(v.string()),
	filters: v.optional(v.record(v.string(), v.string()))
};
