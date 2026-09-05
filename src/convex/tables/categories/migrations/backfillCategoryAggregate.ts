// AGGREGATES
import { categoryAggregate } from '../aggregates/categoryAggregate.js';

// MIGRATIONS
import { migrations } from '../../../migrations/migrations.js';

export const backfillCategoryAggregate = migrations.define({
	table: 'categories',
	migrateOne: async (ctx, category) => {
		await categoryAggregate.insertIfDoesNotExist(ctx, category);
	}
});
