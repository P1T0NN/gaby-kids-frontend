// LIBRARIES
import { AuditActions } from 'convex-audit-log';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// CONFIG
import { CATEGORY_CONFIG } from '../../../../shared/features/categories/config.js';

// AUDIT LOGS
import { logAuditEvent } from '../../../auditLogs/helpers/logAuditEvent.js';

// AGGREGATES
import { productsByCategoryAggregate } from '../aggregates/productsByCategoryAggregate.js';

// STORAGE
import { deleteStoredFiles } from '../../../storage/r2.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const deleteCategory = adminMutation({
	rateLimit: { name: 'categories:delete' },
	args: { id: v.id('categories') },
	returns: v.null(),
	handler: async (ctx, args) => {
		const category = await ctx.db.get(args.id);
		if (!category) {
			throw new ConvexError<BackendErrorData>({ code: 'CATEGORY_NOT_FOUND' });
		}

		const products = await ctx.db
			.query('products')
			.withIndex('by_category_id', (query) => query.eq('categoryId', args.id))
			.take(CATEGORY_CONFIG.maxCategoryProductNames);
		if (products.length > 0) {
			const productCount = Math.max(
				products.length,
				await productsByCategoryAggregate.count(ctx, { namespace: args.id })
			);

			throw new ConvexError<BackendErrorData>({
				code: 'CATEGORY_HAS_PRODUCTS',
				productNames: products.map((product) => product.name),
				productCount
			});
		}

		if (category.imageKey) await deleteStoredFiles(ctx, [category.imageKey]);
		await ctx.db.delete(args.id);

		await logAuditEvent(ctx, ctx.identity, {
			action: AuditActions.RECORD_DELETED,
			resourceType: 'categories',
			resourceId: args.id,
			severity: 'warning'
		});

		return null;
	}
});
