// LIBRARIES
import { ConvexError } from 'convex/values';

// TYPES
import type { Doc, Id } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

type SellableProductVariant = {
	product: Doc<'products'>;
	productVariant: Doc<'productVariants'>;
};

/** Load an active product and its stored product variant with a valid price. */
export async function loadSellableProductVariant(
	ctx: QueryCtx,
	productVariantId: Id<'productVariants'>
): Promise<SellableProductVariant> {
	const productVariant = await ctx.db.get(productVariantId);
	if (!productVariant) {
		throw new ConvexError<BackendErrorData>({ code: 'ORDER_PRODUCT_UNAVAILABLE' });
	}

	const product = await ctx.db.get(productVariant.productId);
	if (!product || product.status !== 'active') {
		throw new ConvexError<BackendErrorData>({ code: 'ORDER_PRODUCT_UNAVAILABLE' });
	}

	if (!Number.isSafeInteger(productVariant.priceInCents) || productVariant.priceInCents < 0) {
		throw new Error('Product variant price invariant violated.');
	}

	return { product, productVariant };
}
