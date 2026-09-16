// LIBRARIES
import { AuditActions } from 'convex-audit-log';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// AUDIT LOGS
import { logAuditEvent } from '../../../auditLogs/helpers/logAuditEvent.js';

// STORAGE
import { deleteStoredFiles } from '../../../storage/r2.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const deleteProduct = adminMutation({
	rateLimit: { name: 'products:delete' },
	args: { id: v.id('products') },
	returns: v.null(),
	handler: async (ctx, args) => {
		const product = await ctx.db.get(args.id);
		if (!product) {
			throw new ConvexError<BackendErrorData>({ code: 'PRODUCT_NOT_FOUND' });
		}
		if (product.status !== 'draft' || product.reservedInventory > 0) {
			throw new ConvexError<BackendErrorData>({ code: 'PRODUCT_DELETE_RESTRICTED' });
		}

		await ctx.db.delete(args.id);

		const productImageKeys = product.imageKeys ?? product.images;
		await deleteStoredFiles(ctx, productImageKeys);

		await logAuditEvent(ctx, ctx.identity, {
			action: AuditActions.RECORD_DELETED,
			resourceType: 'products',
			resourceId: args.id,
			severity: 'warning'
		});

		return null;
	}
});
