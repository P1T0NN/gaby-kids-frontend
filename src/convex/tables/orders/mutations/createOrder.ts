// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { mutation } from '../../../builders/convexFunctionBuilders.js';

// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// VALIDATORS
import { fulfillmentMethod, shippingAddress } from '../validators/orderValidators.js';

// SCHEMAS
import { createOrderSchema } from '../../../../shared/features/orders/schemas/ordersSchemas.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';
import type { Id } from '../../../_generated/dataModel.js';

export const createOrder = mutation({
	rateLimit: { name: 'orders:create', scope: 'global' },
	args: {
		retryKey: v.string(),
		items: v.array(v.object({ productId: v.id('products'), quantity: v.number() })),
		firstName: v.string(),
		lastName: v.string(),
		email: v.string(),
		phone: v.string(),
		fulfillmentMethod,
		shippingAddress: v.optional(shippingAddress)
	},
	returns: v.id('orders'),
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

		const lines = [...quantities.entries()].sort(([left], [right]) => left.localeCompare(right));
		const address =
			data.fulfillmentMethod === 'delivery' && data.shippingAddress
				? data.shippingAddress
				: undefined;
		const lineFingerprint = JSON.stringify({
			lines,
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			phone: data.phone,
			fulfillmentMethod: data.fulfillmentMethod,
			address
		});
		const existing = await ctx.db
			.query('orders')
			.withIndex('by_retry_key', (query) => query.eq('retryKey', data.retryKey))
			.unique();
		if (existing) {
			if (existing.lineFingerprint !== lineFingerprint)
				throw new ConvexError<BackendErrorData>({ code: 'ORDER_RETRY_CONFLICT' });
			return existing._id;
		}

		const snapshots = [];
		let subtotalInCents = 0;
		for (const [productId, quantity] of lines) {
			const product = await ctx.db.get(productId);
			if (!product || product.status !== 'active')
				throw new ConvexError<BackendErrorData>({ code: 'ORDER_PRODUCT_UNAVAILABLE' });
			if (!Number.isSafeInteger(product.priceInCents) || product.priceInCents < 0)
				throw new Error('Product price invariant violated.');
			const lineTotal = product.priceInCents * quantity;
			if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(subtotalInCents + lineTotal))
				throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
			subtotalInCents += lineTotal;
			snapshots.push({
				productId,
				name: product.name,
				unitPriceInCents: product.priceInCents,
				quantity
			});
		}

		const identity = await ctx.auth.getUserIdentity();
		const now = Date.now();
		const orderId = await ctx.db.insert('orders', {
			customerId: identity?.subject,
			retryKey: data.retryKey,
			lineFingerprint,
			currency: COMPANY_DATA.CURRENCY,
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			phone: data.phone,
			fulfillmentMethod: data.fulfillmentMethod,
			shippingAddress: address,
			subtotalInCents,
			totalInCents: subtotalInCents,
			paymentStatus: 'pending',
			fulfillmentStatus: 'unfulfilled',
			updatedAt: now
		});
		for (const snapshot of snapshots) await ctx.db.insert('orderItems', { orderId, ...snapshot });
		return orderId;
	}
});
