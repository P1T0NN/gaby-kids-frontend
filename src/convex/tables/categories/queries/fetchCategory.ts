import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

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

		return category;
	}
});
