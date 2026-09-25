import { resolveStoredFileUrls } from '../storage/r2.js';
import { migrations } from './migrations.js';

export const backfillCategoryImages = migrations.define({
	table: 'categories',
	migrateOne: async (_ctx, category) => {
		if (!category.imageKey || category.image !== undefined) return;
		return { image: (await resolveStoredFileUrls([category.imageKey]))[0] };
	}
});
