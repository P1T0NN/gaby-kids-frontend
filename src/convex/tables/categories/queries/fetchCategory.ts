import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// VALIDATORS
import { categoryResult } from '../validators/categoryValidators.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const fetchCategory = adminQuery({
	args: { id: v.id('categories') },
	returns: categoryResult,
	handler: async (ctx, args) => {
		const category = await ctx.db.get(args.id);
		if (!category) {
			throw new ConvexError<BackendErrorData>({ code: 'CATEGORY_NOT_FOUND' });
		}

		const image = category.imageKey
			? (await resolveStoredFileUrls([category.imageKey]))[0]
			: undefined;
		const result: typeof category & { image?: string } = { ...category };
		if (image) result.image = image;
		return result;
	}
});
