// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// CONVEX
import { internal } from '../../../_generated/api.js';

// CONFIG
import { PRODUCT_VARIANTS_CONFIG } from '../../../../shared/features/productVariants/config.js';

/** Deletes one bounded batch of a deleted product's variants, rescheduling while more remain. */
export const deleteProductVariantsBatch = internalMutation({
	args: { productId: v.id('products') },
	returns: v.null(),
	handler: async (ctx, { productId }) => {
		const productVariants = await ctx.db
			.query('productVariants')
			.withIndex('by_product_id', (query) => query.eq('productId', productId))
			.take(PRODUCT_VARIANTS_CONFIG.DELETION_BATCH_SIZE);

		for (const productVariant of productVariants) {
			if (productVariant.reservedInventory > 0) {
				throw new Error('Product variant deletion invariant violated.');
			}
			await ctx.db.delete(productVariant._id);
		}

		if (productVariants.length === PRODUCT_VARIANTS_CONFIG.DELETION_BATCH_SIZE) {
			await ctx.scheduler.runAfter(
				0,
				internal.tables.productVariants.mutations.deleteProductVariantsBatch
					.deleteProductVariantsBatch,
				{ productId }
			);
		}

		return null;
	}
});
