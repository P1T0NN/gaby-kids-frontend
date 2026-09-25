// LIBRARIES
import { ConvexError } from 'convex/values';

// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// UTILS
import { calculateOrderTotalInCents } from '../../../../shared/utils/pricing.js';
import { calculateShippingInCents } from '../../../../shared/features/orders/utils/calculateShippingInCents.js';
import { getProductVariantLabel } from '../../../../shared/features/productVariants/utils/getProductVariantLabel.js';

// HELPERS
import { buildCheckoutLine, type CheckoutLine } from '../../orders/helpers/buildCheckoutLine.js';
import { loadSellableProductVariant } from '../../productVariants/helpers/loadSellableProductVariant.js';
import { mergeItemQuantities } from '../../orders/helpers/mergeItemQuantities.js';

// SCHEMAS
import { createOrderSchema } from '../../../../shared/features/orders/schemas/ordersSchemas.js';

// VALIDATORS
import {
	checkoutReservationResult,
	createCheckoutReservationArgs
} from '../validators/checkoutReservationValidators.js';

// UTILS
import { isUuid } from '../../../../shared/utils/isUuid.js';

// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

type CheckoutItem = CheckoutLine;
type ReservedItem = {
	productId: Id<'products'>;
	productVariantId: Id<'productVariants'>;
	name: string;
	productVariantLabel: string;
	sku: string;
	unitPriceInCents: number;
	quantity: number;
	trackInventory: boolean;
};
type InventoryUpdate = { productVariantId: Id<'productVariants'>; reservedInventory: number };
type ReservationLines = {
	checkoutItems: CheckoutItem[];
	reservedItems: ReservedItem[];
	inventoryUpdates: InventoryUpdate[];
};

/** Price and availability-check each product variant, then build the trusted snapshot lines. */
async function buildReservationLines(
	ctx: MutationCtx,
	quantities: Map<Id<'productVariants'>, number>
): Promise<ReservationLines> {
	const checkoutItems: CheckoutItem[] = [];
	const reservedItems: ReservedItem[] = [];
	const inventoryUpdates: InventoryUpdate[] = [];
	const sortedQuantities = [...quantities].sort(([a], [b]) => a.localeCompare(b));

	for (const [productVariantId, quantity] of sortedQuantities) {
		const { product, productVariant } = await loadSellableProductVariant(ctx, productVariantId);

		const availableInventory = productVariant.inventory - productVariant.reservedInventory;
		const hasInsufficientInventory = product.trackInventory && availableInventory < quantity;
		if (hasInsufficientInventory) {
			throw new ConvexError<BackendErrorData>({ code: 'ORDER_PRODUCT_UNAVAILABLE' });
		}

		checkoutItems.push(await buildCheckoutLine(product, productVariant, quantity));
		reservedItems.push({
			productId: product._id,
			productVariantId,
			name: product.name,
			productVariantLabel: getProductVariantLabel(productVariant.options),
			sku: productVariant.sku,
			unitPriceInCents: productVariant.priceInCents,
			quantity,
			trackInventory: product.trackInventory
		});
		if (product.trackInventory) {
			inventoryUpdates.push({
				productVariantId,
				reservedInventory: productVariant.reservedInventory + quantity
			});
		}
	}

	return { checkoutItems, reservedItems, inventoryUpdates };
}

export const createCheckoutReservation = internalMutation({
	args: createCheckoutReservationArgs.fields,
	returns: checkoutReservationResult,
	handler: async (ctx, args) => {
		const parsed = createOrderSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
		const data = parsed.data;
		if (!isUuid(args.customerRef))
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });

		const quantities = mergeItemQuantities(data.items);
		const { checkoutItems, reservedItems, inventoryUpdates } = await buildReservationLines(
			ctx,
			quantities
		);

		const subtotalInCents = calculateOrderTotalInCents(checkoutItems);
		if (!Number.isSafeInteger(subtotalInCents) || subtotalInCents <= 0) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
		}
		const shippingInCents = calculateShippingInCents(subtotalInCents, data.fulfillmentMethod);
		const totalInCents = subtotalInCents + shippingInCents;

		for (const update of inventoryUpdates) {
			await ctx.db.patch(update.productVariantId, {
				reservedInventory: update.reservedInventory
			});
		}

		const identity = await ctx.auth.getUserIdentity();
		const checkout = {
			...data,
			items: checkoutItems,
			// Guests keep their anonymous device id so the order can be claimed after signing in.
			customerId: identity?.subject ?? args.customerRef,
			shippingAddress: data.fulfillmentMethod === 'delivery' ? data.shippingAddress : undefined,
			currency: COMPANY_DATA.CURRENCY,
			subtotalInCents,
			shippingInCents,
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
