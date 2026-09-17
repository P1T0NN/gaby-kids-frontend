// LIBRARIES
import { AuditActions } from 'convex-audit-log';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// SCHEMAS
import { saveProductUpsellsSchema } from '../../../../shared/features/upsells/schemas/upsellsSchemas.js';

// HELPERS
import { logAuditEvent } from '../../../auditLogs/helpers/logAuditEvent.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const saveProductUpsells = adminMutation({
	rateLimit: { name: 'upsells:save' },
	args: { productId: v.id('products'), upsellProductIds: v.array(v.id('products')) },
	returns: v.null(),
	handler: async (ctx, args) => {
		const parsed = saveProductUpsellsSchema.safeParse(args);
		if (!parsed.success) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPSELL_DATA' });
		}

		const { productId, upsellProductIds } = parsed.data;

		const hasDuplicates = new Set(upsellProductIds).size !== upsellProductIds.length;
		const recommendsItself = upsellProductIds.includes(productId);
		if (hasDuplicates || recommendsItself) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPSELL_DATA' });
		}

		const product = await ctx.db.get('products', productId);
		if (!product) throw new ConvexError<BackendErrorData>({ code: 'PRODUCT_NOT_FOUND' });

		const recommendations = await Promise.all(
			upsellProductIds.map((id) => ctx.db.get('products', id))
		);

		const hasUnavailableProduct = recommendations.some((item) => !item || item.status !== 'active');
		if (hasUnavailableProduct) {
			throw new ConvexError<BackendErrorData>({ code: 'UPSELL_PRODUCT_UNAVAILABLE' });
		}

		await ctx.db.patch('products', productId, { upsellProductIds });

		await logAuditEvent(ctx, ctx.identity, {
			action: AuditActions.RECORD_UPDATED,
			resourceType: 'upsells',
			resourceId: productId,
			severity: 'info'
		});

		return null;
	}
});
