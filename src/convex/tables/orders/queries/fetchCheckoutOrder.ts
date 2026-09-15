// LIBRARIES
import { ConvexError } from 'convex/values';
import { internalQuery } from '../../../_generated/server.js';

// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// VALIDATORS
import { createOrderArgs } from '../validators/orderValidators.js';
import { checkoutSnapshot } from '../../../stripe/validators/stripeValidators.js';
import { createOrderSchema } from '../../../../shared/features/orders/schemas/ordersSchemas.js';

// UTILS
import { calculateOrderTotalInCents } from '../../../../shared/utils/pricing.js';

// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

// Prepares trusted Stripe inputs without creating any order or checkout documents.
export const fetchCheckoutOrder = internalQuery({
	args: createOrderArgs.fields,
	returns: checkoutSnapshot,
	handler: async (ctx, args) => {
		const parsed = createOrderSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
		const data = parsed.data;
		const quantities = new Map<Id<'products'>, number>();
		for (const item of data.items) {
			const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
			if (quantity > ORDER_CONFIG.maxQuantity)
				throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
			quantities.set(item.productId, quantity);
		}

		const items = [];
		for (const [productId, quantity] of [...quantities].sort(([a], [b]) => a.localeCompare(b))) {
			const product = await ctx.db.get(productId);
			if (!product || product.status !== 'active')
				throw new ConvexError<BackendErrorData>({ code: 'ORDER_PRODUCT_UNAVAILABLE' });
			if (!Number.isSafeInteger(product.priceInCents) || product.priceInCents < 0)
				throw new Error('Product price invariant violated.');
			const imageKey = (product.imageKeys ?? product.images)[0];
			const imageUrl = imageKey ? (await resolveStoredFileUrls([imageKey]))[0] : undefined;
			items.push({
				productId,
				name: product.name,
				unitPriceInCents: product.priceInCents,
				quantity,
				imageUrl: imageUrl ?? ''
			});
		}
		const totalInCents = calculateOrderTotalInCents(items);
		if (!Number.isSafeInteger(totalInCents) || totalInCents <= 0)
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });

		const identity = await ctx.auth.getUserIdentity();
		return {
			...data,
			items,
			// Existing order ownership uses the single configured auth provider's subject.
			customerId: identity?.subject,
			shippingAddress: data.fulfillmentMethod === 'delivery' ? data.shippingAddress : undefined,
			currency: COMPANY_DATA.CURRENCY,
			totalInCents
		};
	}
});
