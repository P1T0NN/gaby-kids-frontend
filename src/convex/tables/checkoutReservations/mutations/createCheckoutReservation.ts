// LIBRARIES
import { ConvexError } from 'convex/values';

// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// UTILS
import { calculateOrderTotalInCents } from '../../../../shared/utils/pricing.js';
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// SCHEMAS
import { createOrderSchema } from '../../../../shared/features/orders/schemas/ordersSchemas.js';

// VALIDATORS
import { createOrderArgs } from '../../orders/validators/orderValidators.js';
import { checkoutReservationResult } from '../validators/checkoutReservationValidators.js';

// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const createCheckoutReservation = internalMutation({
	args: createOrderArgs.fields,
	returns: checkoutReservationResult,
	handler: async (ctx, args) => {
		const parsed = createOrderSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
		const data = parsed.data;
		const quantities = new Map<Id<'products'>, number>();
		for (const item of data.items) {
			const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
			if (quantity > ORDER_CONFIG.maxQuantity) {
				throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
			}
			quantities.set(item.productId, quantity);
		}

		const checkoutItems = [];
		const reservedItems = [];
		const inventoryUpdates = [];
		const sortedQuantities = [...quantities].sort(([a], [b]) => a.localeCompare(b));

		for (const [productId, quantity] of sortedQuantities) {
			const product = await ctx.db.get(productId);
			if (!product || product.status !== 'active') {
				throw new ConvexError<BackendErrorData>({ code: 'ORDER_PRODUCT_UNAVAILABLE' });
			}

			const hasInvalidPrice =
				!Number.isSafeInteger(product.priceInCents) || product.priceInCents < 0;

			if (hasInvalidPrice) {
				throw new Error('Product price invariant violated.');
			}

			const availableInventory = product.inventory - product.reservedInventory;
			const hasInsufficientInventory = product.trackInventory && availableInventory < quantity;
			if (hasInsufficientInventory) {
				throw new ConvexError<BackendErrorData>({ code: 'ORDER_PRODUCT_UNAVAILABLE' });
			}

			const imageKey = (product.imageKeys ?? product.images)[0];
			const imageUrl = imageKey ? (await resolveStoredFileUrls([imageKey]))[0] : undefined;

			checkoutItems.push({
				productId,
				name: product.name,
				unitPriceInCents: product.priceInCents,
				quantity,
				imageUrl: imageUrl ?? ''
			});

			reservedItems.push({
				productId,
				name: product.name,
				unitPriceInCents: product.priceInCents,
				quantity,
				trackInventory: product.trackInventory
			});

			if (product.trackInventory) {
				inventoryUpdates.push({
					productId,
					reservedInventory: product.reservedInventory + quantity
				});
			}
		}

		const totalInCents = calculateOrderTotalInCents(checkoutItems);
		if (!Number.isSafeInteger(totalInCents) || totalInCents <= 0) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
		}

		for (const update of inventoryUpdates) {
			await ctx.db.patch(update.productId, { reservedInventory: update.reservedInventory });
		}

		const identity = await ctx.auth.getUserIdentity();
		const checkout = {
			...data,
			items: checkoutItems,
			customerId: identity?.subject,
			shippingAddress: data.fulfillmentMethod === 'delivery' ? data.shippingAddress : undefined,
			currency: COMPANY_DATA.CURRENCY,
			totalInCents
		};

		const expiresAt = Date.now() + ORDER_CONFIG.checkoutReservationMinutes * 60_000;

		const reservationId = await ctx.db.insert('checkoutReservations', {
			status: 'active',
			expiresAt,
			currency: checkout.currency,
			totalInCents,
			items: reservedItems
		});

		return {
			reservationId,
			expiresAt,
			checkout
		};
	}
});
