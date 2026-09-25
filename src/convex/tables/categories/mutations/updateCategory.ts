import { AuditActions } from 'convex-audit-log';
import { ConvexError, v } from 'convex/values';

// SCHEMAS
import { updateCategorySchema } from '../../../../shared/features/categories/schemas/categoriesSchemas.js';

// BUILDERS
import { adminUploadMutation } from '../../../builders/convexFunctionBuilders.js';

// CONFIG
import { CATEGORY_CONFIG } from '../../../../shared/features/categories/config.js';

// AUDIT LOGS
import { logAuditEvent } from '../../../auditLogs/helpers/logAuditEvent.js';

// HELPERS
import { getCategoryImageKey } from '../helpers/getCategoryImageKey.js';

// STORAGE
import { deleteStoredFiles, resolveStoredFileUrls } from '../../../storage/r2.js';

// UTILS
import { generateSlug } from '../../../../shared/utils/generateSlug.js';

// VALIDATORS
import { categoryResult } from '../validators/categoryValidators.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';
import type { Doc } from '../../../_generated/dataModel.js';
import type { WithoutSystemFields } from 'convex/server';

export const updateCategory = adminUploadMutation({
	rateLimit: { name: 'categories:update' },
	args: {
		id: v.id('categories'),
		name: v.string(),
		status: v.union(v.literal('active'), v.literal('archived'))
	},
	returns: categoryResult,
	handler: async (ctx, args) => {
		const parsed = updateCategorySchema.safeParse(args);
		if (!parsed.success) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_CATEGORY_DATA' });
		}

		const slug = generateSlug(parsed.data.name);
		if (!slug || slug.length > CATEGORY_CONFIG.maxSlugLength) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_CATEGORY_DATA' });
		}

		const category = await ctx.db.get(args.id);
		if (!category) {
			throw new ConvexError<BackendErrorData>({ code: 'CATEGORY_NOT_FOUND' });
		}

		const existingSlug = await ctx.db
			.query('categories')
			.withIndex('by_slug', (query) => query.eq('slug', slug))
			.unique();
		if (existingSlug && existingSlug._id !== args.id) {
			throw new ConvexError<BackendErrorData>({ code: 'CATEGORY_SLUG_TAKEN' });
		}

		const imageKey = getCategoryImageKey(args.uploadedFiles, args.retainedFiles, category.imageKey);
		const nextCategory: WithoutSystemFields<Doc<'categories'>> = {
			name: parsed.data.name,
			slug,
			status: parsed.data.status
		};
		if (imageKey) {
			nextCategory.image = (await resolveStoredFileUrls([imageKey]))[0];
			nextCategory.imageKey = imageKey;
		}
		await ctx.db.replace(args.id, nextCategory);
		if (category.imageKey && category.imageKey !== imageKey) {
			await deleteStoredFiles(ctx, [category.imageKey]);
		}

		await logAuditEvent(ctx, ctx.identity, {
			action: AuditActions.RECORD_UPDATED,
			resourceType: 'categories',
			resourceId: args.id,
			severity: 'info'
		});

		return (await ctx.db.get(args.id))!;
	}
});
