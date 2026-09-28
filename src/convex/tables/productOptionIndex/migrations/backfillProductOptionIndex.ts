// HELPERS
import { createProductOptionIndex } from '../helpers/createProductOptionIndex.js';

// MIGRATIONS
import { migrations } from '../../../migrations/migrations.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';

/** Rebuilds every product's option index rows (idempotent). */
export const backfillProductOptionIndex = migrations.define({
	table: 'products',
	migrateOne: async (ctx, product) => {
		const variants: Doc<'productVariants'>[] = [];

		for await (const variant of ctx.db
			.query('productVariants')
			.withIndex('by_product_id', (query) => query.eq('productId', product._id))) {
			variants.push(variant);
		}

		await createProductOptionIndex({ ctx, product, variants });
	}
});

/** Adds search names to existing rows without changing their cursor order. */
export const backfillProductOptionNames = migrations.define({
	table: 'productOptionIndex',
	migrateOne: async (ctx, row) => {
		const product = await ctx.db.get(row.productId);
		if (!product) {
			await ctx.db.delete(row._id);
			return;
		}
		if (row.name !== product.name) await ctx.db.patch(row._id, { name: product.name });
	}
});
