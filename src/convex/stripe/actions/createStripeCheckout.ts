'use node';

// LIBRARIES
import { randomUUID } from 'node:crypto';
import { ConvexError } from 'convex/values';
import type { BackendErrorData } from '../../../shared/types/types.js';
import { internal } from '../../_generated/api.js';

// BUILDERS
import { action } from '../../builders/convexFunctionBuilders.js';

// CONFIG
import { env } from '../../_generated/server.js';
import { STRIPE_CHECKOUT_CAPTCHA_ACTION } from '../../../shared/features/captcha/config.js';
import { stripe } from '../stripe.config.js';

// HELPERS
import { buildCheckoutLineItems } from '../utils/buildCheckoutLineItems.js';

// TURNSTILE
import { verifyTurnstileToken } from '../../turnstile/verifyTurnstile.js';

// VALIDATORS
import {
	createStripeCheckoutArgs,
	createStripeCheckoutResult
} from '../validators/stripeValidators.js';

export const createStripeCheckout = action({
	rateLimit: { name: 'orders:checkout', scope: 'global' },
	args: createStripeCheckoutArgs.fields,
	returns: createStripeCheckoutResult,
	handler: async (ctx, args): Promise<{ checkoutUrl: string }> => {
		const { turnstileToken, ...orderArgs } = args;
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) await verifyTurnstileToken(turnstileToken ?? '', STRIPE_CHECKOUT_CAPTCHA_ACTION);

		// Guest receipt credential, not a checkout retry/idempotency key.
		const receiptToken = randomUUID();
		const checkout = await ctx.runQuery(
			internal.tables.orders.queries.fetchCheckoutOrder.fetchCheckoutOrder,
			{ ...orderArgs, receiptToken }
		);
		const successUrl = new URL('/checkout/success', env.PUBLIC_ORIGIN);
		successUrl.searchParams.set('key', receiptToken);
		const address = checkout.shippingAddress;
		const metadata = {
			receiptToken,
			customerId: checkout.customerId ?? '',
			firstName: checkout.firstName,
			lastName: checkout.lastName,
			email: checkout.email,
			phone: checkout.phone,
			fulfillmentMethod: checkout.fulfillmentMethod,
			street: address?.street ?? '',
			apartment: address?.apartment ?? '',
			postalCode: address?.postalCode ?? '',
			city: address?.city ?? '',
			country: address?.country ?? '',
			currency: checkout.currency,
			totalInCents: String(checkout.totalInCents),
			itemCount: String(checkout.items.length)
		};
		if (Object.values(metadata).some((value) => value.length > 500))
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });

		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			adaptive_pricing: { enabled: false },
			integration_identifier: 'convex_checkout_hxqplmzr',
			customer_email: checkout.email,
			line_items: buildCheckoutLineItems(checkout.currency.toLowerCase(), checkout.items),
			metadata,
			success_url: successUrl.toString() + '&session_id={CHECKOUT_SESSION_ID}',
			cancel_url: new URL('/checkout', env.PUBLIC_ORIGIN).toString()
		});

		if (session.status !== 'open' || session.url === null)
			throw new ConvexError<BackendErrorData>({ code: 'ORDER_PAYMENT_UNAVAILABLE' });
		return { checkoutUrl: session.url };
	}
});
