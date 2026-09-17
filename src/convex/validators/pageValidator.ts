// LIBRARIES
import { v, type GenericValidator } from 'convex/values';

/**
 * The cursor-page envelope shared by the paginated list queries: a page of items
 * plus the keyset cursor, the page size, and an optional total.
 */
export function pageValidator<ItemValidator extends GenericValidator>(item: ItemValidator) {
	return v.object({
		items: v.array(item),
		nextCursor: v.union(v.string(), v.null()),
		hasNextPage: v.boolean(),
		pageSize: v.number(),
		total: v.optional(v.number())
	});
}
