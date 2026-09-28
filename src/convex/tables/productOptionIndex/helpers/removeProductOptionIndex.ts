// HELPERS
import { readProductOptionIndexRows } from '../helpers/readProductOptionIndexRows.js';

// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

/** Remove a deleted product's `productOptionIndex` rows. */
export async function removeProductOptionIndex(
	ctx: MutationCtx,
	productId: Id<'products'>
): Promise<void> {
	const existingRows = await readProductOptionIndexRows(ctx, productId);

	for (const row of existingRows) {
		await ctx.db.delete(row._id);
	}
}
