// HELPERS
import { invalidCategory } from './invalidCategory.js';

// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

export async function validateProductCategory(
	ctx: MutationCtx,
	categoryId: Id<'categories'>,
	currentCategoryId?: Id<'categories'>
): Promise<void> {
	const category = await ctx.db.get(categoryId);
	const isUnavailableCategory =
		!category || (category.status === 'archived' && categoryId !== currentCategoryId);
	if (isUnavailableCategory) {
		throw invalidCategory();
	}
}
