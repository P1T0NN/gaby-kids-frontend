// LIBRARIES
import { ConvexError } from 'convex/values';
import { internalQuery } from '../../../_generated/server.js';

// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';

// HELPERS
import { buildCheckoutLine, type CheckoutLine } from '../../orders/helpers/buildCheckoutLine.js';
import { loadSellableProductVariant } from '../../productVariants/helpers/loadSellableProductVariant.js';
import { mergeItemQuantities } from '../../orders/helpers/mergeItemQuantities.js';

// VALIDATORS
import { createOrderArgs } from '../validators/orderValidators.js';
import { checkoutSnapshot } from '../../../stripe/validators/stripeValidators.js';
import { createOrderSchema } from '../../../../shared/features/orders/schemas/ordersSchemas.js';

// UTILS
import { calculateOrderTotalInCents } from '../../../../shared/utils/pricing.js';

// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

type CheckoutItem = CheckoutLine;

/** Price-check each active product variant and build the trusted checkout lines. */
async function buildCheckoutItems(
	ctx: QueryCtx,
	quantities: Map<Id<'productVariants'>, number>
): Promise<CheckoutItem[]> {
	const items: CheckoutItem[] = [];
	const sortedQuantities = [...quantities].sort(([a], [b]) => a.localeCompare(b));

	for (const [productVariantId, quantity] of sortedQuantities) {
		const { product, productVariant } = await loadSellableProductVariant(ctx, productVariantId);

		items.push(await buildCheckoutLine(product, productVariant, quantity));
	}

	return items;
}

// Prepares trusted Stripe inputs without creating any order or checkout documents.
export const fetchCheckoutOrder = internalQuery({
	args: createOrderArgs.fields,
	returns: checkoutSnapshot,
	handler: async (ctx, args) => {
		const parsed = createOrderSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
		const data = parsed.data;

		const quantities = mergeItemQuantities(data.items);
		const items = await buildCheckoutItems(ctx, quantities);
		const totalInCents = calculateOrderTotalInCents(items);
		if (!Number.isSafeInteger(totalInCents) || totalInCents <= 0) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
		}

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
