// LIBRARIES
import { AuditActions } from 'convex-audit-log';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminUploadMutation } from '../../../builders/convexFunctionBuilders.js';

// CONFIG
import { CATEGORY_CONFIG } from '../../../../shared/features/categories/config.js';

// AUDIT LOGS
import { logAuditEvent } from '../../../auditLogs/helpers/logAuditEvent.js';

// HELPERS
import { getCategoryImageKey } from '../helpers/getCategoryImageKey.js';

// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// VALIDATORS
import { categoryResult } from '../validators/categoryValidators.js';

// SCHEMAS
import { createCategorySchema } from '../../../../shared/features/categories/schemas/categoriesSchemas.js';

// UTILS
import { generateSlug } from '../../../../shared/utils/generateSlug.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';
import type { Doc } from '../../../_generated/dataModel.js';
import type { WithoutSystemFields } from 'convex/server';

export const createCategory = adminUploadMutation({
	rateLimit: { name: 'categories:create' },
	args: {
		name: v.string(),
		status: v.union(v.literal('active'), v.literal('archived'))
	},
	returns: categoryResult,
	handler: async (ctx, args) => {
		const parsed = createCategorySchema.safeParse(args);
		if (!parsed.success) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_CATEGORY_DATA' });
		}

		const slug = generateSlug(parsed.data.name);
		if (!slug || slug.length > CATEGORY_CONFIG.maxSlugLength) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_CATEGORY_DATA' });
		}

		const existingSlug = await ctx.db
			.query('categories')
			.withIndex('by_slug', (query) => query.eq('slug', slug))
			.unique();
		if (existingSlug) {
			throw new ConvexError<BackendErrorData>({ code: 'CATEGORY_SLUG_TAKEN' });
		}

		const imageKey = getCategoryImageKey(args.uploadedFiles, args.retainedFiles);
		const category: WithoutSystemFields<Doc<'categories'>> = {
			name: parsed.data.name,
			slug,
			status: parsed.data.status
		};
		if (imageKey) {
			category.image = (await resolveStoredFileUrls([imageKey]))[0];
			category.imageKey = imageKey;
		}
		const categoryId = await ctx.db.insert('categories', category);

		await logAuditEvent(ctx, ctx.identity, {
			action: AuditActions.RECORD_CREATED,
			resourceType: 'categories',
			resourceId: categoryId,
			severity: 'info'
		});

		return (await ctx.db.get(categoryId))!;
	}
});
