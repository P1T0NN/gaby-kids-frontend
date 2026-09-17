// LIBRARIES
import { ConvexError } from 'convex/values';

// TYPES
import type { Doc, Id } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Load an active product whose stored price is a valid non-negative integer. */
export async function loadSellableProduct(
	ctx: QueryCtx,
	productId: Id<'products'>
): Promise<Doc<'products'>> {
	const product = await ctx.db.get(productId);
	if (!product || product.status !== 'active') {
		throw new ConvexError<BackendErrorData>({ code: 'ORDER_PRODUCT_UNAVAILABLE' });
	}
	if (!Number.isSafeInteger(product.priceInCents) || product.priceInCents < 0) {
		throw new Error('Product price invariant violated.');
	}

	return product;
}
