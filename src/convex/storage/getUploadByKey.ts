// CONVEX
import type { QueryCtx } from '../_generated/server.js';

// TYPES
import type { Doc } from '../_generated/dataModel.js';

/** Load a `storageUploads` row by its object key, or null when it does not exist. */
export async function getUploadByKey(
	ctx: QueryCtx,
	key: string
): Promise<Doc<'storageUploads'> | null> {
	return ctx.db
		.query('storageUploads')
		.withIndex('by_key', (query) => query.eq('key', key))
		.unique();
}
