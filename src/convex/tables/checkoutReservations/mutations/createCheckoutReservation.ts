// LIBRARIES
import { ConvexError } from 'convex/values';

// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// UTILS
import { calculateOrderTotalInCents } from '../../../../shared/utils/pricing.js';

// HELPERS
import { buildCheckoutLine, type CheckoutLine } from '../../orders/helpers/buildCheckoutLine.js';
import { loadSellableProduct } from '../../products/helpers/loadSellableProduct.js';
import { mergeItemQuantities } from '../../orders/helpers/mergeItemQuantities.js';

// SCHEMAS
import { createOrderSchema } from '../../../../shared/features/orders/schemas/ordersSchemas.js';

// VALIDATORS
import { createOrderArgs } from '../../orders/validators/orderValidators.js';
import { checkoutReservationResult } from '../validators/checkoutReservationValidators.js';

// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

type CheckoutItem = CheckoutLine;
type ReservedItem = {
	productId: Id<'products'>;
	name: string;
	unitPriceInCents: number;
	quantity: number;
	trackInventory: boolean;
};
type InventoryUpdate = { productId: Id<'products'>; reservedInventory: number };
type ReservationLines = {
	checkoutItems: CheckoutItem[];
	reservedItems: ReservedItem[];
	inventoryUpdates: InventoryUpdate[];
};

/** Price and availability-check each product, then build the trusted snapshot lines. */
async function buildReservationLines(
	ctx: MutationCtx,
	quantities: Map<Id<'products'>, number>
): Promise<ReservationLines> {
	const checkoutItems: CheckoutItem[] = [];
	const reservedItems: ReservedItem[] = [];
	const inventoryUpdates: InventoryUpdate[] = [];
	const sortedQuantities = [...quantities].sort(([a], [b]) => a.localeCompare(b));

	for (const [productId, quantity] of sortedQuantities) {
		const product = await loadSellableProduct(ctx, productId);

		const availableInventory = product.inventory - product.reservedInventory;
		const hasInsufficientInventory = product.trackInventory && availableInventory < quantity;
		if (hasInsufficientInventory) {
			throw new ConvexError<BackendErrorData>({ code: 'ORDER_PRODUCT_UNAVAILABLE' });
		}

		checkoutItems.push(await buildCheckoutLine(product, quantity));
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

	return { checkoutItems, reservedItems, inventoryUpdates };
}

export const createCheckoutReservation = internalMutation({
	args: createOrderArgs.fields,
	returns: checkoutReservationResult,
	handler: async (ctx, args) => {
		const parsed = createOrderSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
		const data = parsed.data;

		const quantities = mergeItemQuantities(data.items);
		const { checkoutItems, reservedItems, inventoryUpdates } = await buildReservationLines(
			ctx,
			quantities
		);

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
