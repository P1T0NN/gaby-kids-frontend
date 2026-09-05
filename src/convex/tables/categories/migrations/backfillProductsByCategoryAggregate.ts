// MIGRATIONS
import { migrations } from '../../../migrations/migrations.js';

// AGGREGATES
import { productsByCategoryAggregate } from '../aggregates/productsByCategoryAggregate.js';

export const backfillProductsByCategoryAggregate = migrations.define({
	table: 'products',
	migrateOne: async (ctx, product) => {
		await productsByCategoryAggregate.insertIfDoesNotExist(ctx, product);
	}
});
