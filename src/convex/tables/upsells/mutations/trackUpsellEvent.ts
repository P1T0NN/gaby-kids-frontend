import { literals } from 'convex-helpers/validators';
import { v } from 'convex/values';

import { analytics } from '../../../analytics/analytics.config.js';
import { mutation } from '../../../builders/convexFunctionBuilders.js';

export const trackUpsellEvent = mutation({
	args: {
		event: literals('dialog_viewed', 'product_added', 'dialog_dismissed', 'view_cart_clicked'),
		sourceProductId: v.id('products'),
		upsellProductId: v.optional(v.id('products')),
		sessionRef: v.string()
	},
	returns: v.null(),
	handler: async (ctx, { event, sourceProductId, upsellProductId, sessionRef }) => {
		if (sessionRef.length < 1 || sessionRef.length > 128) return null;

		const sourceProduct = await ctx.db.get('products', sourceProductId);
		if (!sourceProduct || sourceProduct.status !== 'active') return null;

		if (event === 'product_added') {
			if (!upsellProductId || !sourceProduct.upsellProductIds?.includes(upsellProductId))
				return null;
			const upsellProduct = await ctx.db.get('products', upsellProductId);
			if (!upsellProduct || upsellProduct.status !== 'active') return null;
		} else if (upsellProductId !== undefined) {
			return null;
		}

		await analytics.track(ctx, `upsell:${event}`, {
			subjectRef: sessionRef,
			sessionRef,
			props: {
				sourceProductId,
				upsellProductId: upsellProductId ?? null,
				placement: 'add_to_cart_dialog'
			}
		});
		return null;
	}
});
