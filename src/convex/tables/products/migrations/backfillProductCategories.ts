// MIGRATIONS
import { migrations } from '../../../migrations/migrations.js';

// HELPERS
import { getProductCategoryIds } from '../helpers/getProductCategoryIds.js';
import { createProductOptionIndex } from '../../productOptionIndex/helpers/createProductOptionIndex.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';

/** Convert single categories and rebuild scoped search/option rows in the same transaction. */
export const backfillProductCategories = migrations.define({
	table: 'products',
	batchSize: 1,
	migrateOne: async (ctx, product) => {
		if (product.categoryIds && !product.categoryId) return;
		const categoryIds = getProductCategoryIds(product);
		if (categoryIds.length === 0) throw new Error('Product category invariant violated.');
		await ctx.db.patch(product._id, { categoryIds, categoryId: undefined });
		const variants: Doc<'productVariants'>[] = [];
		for await (const variant of ctx.db
			.query('productVariants')
			.withIndex('by_product_id', (query) => query.eq('productId', product._id))) {
			variants.push(variant);
		}
		await createProductOptionIndex({ ctx, product: { ...product, categoryIds }, variants });
	}
});
