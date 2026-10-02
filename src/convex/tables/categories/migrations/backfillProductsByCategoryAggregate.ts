// MIGRATIONS
import { migrations } from '../../../migrations/migrations.js';

// AGGREGATES
import { productsByCategoryAggregate } from '../aggregates/productsByCategoryAggregate.js';
import { getProductCategoryIds } from '../../products/helpers/getProductCategoryIds.js';

export const backfillProductsByCategoryAggregate = migrations.define({
	table: 'products',
	migrateOne: async (ctx, product) => {
		for (const namespace of getProductCategoryIds(product)) {
			await productsByCategoryAggregate.insertIfDoesNotExist(ctx, {
				namespace,
				key: product._creationTime,
				id: product._id
			});
		}
	}
});
