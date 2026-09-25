'use node';

// LIBRARIES
import { randomUUID } from 'node:crypto';
import { ConvexError, type ObjectType } from 'convex/values';
import type { BackendErrorData } from '../../../shared/types/types.js';
import { internal } from '../../_generated/api.js';

// BUILDERS
import { action } from '../../builders/convexFunctionBuilders.js';

// CONFIG
import { env } from '../../_generated/server.js';
import { STRIPE_CHECKOUT_CAPTCHA_ACTION } from '../../../shared/features/captcha/config.js';
import { ORDER_CONFIG } from '../../../shared/features/orders/config.js';
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
import { checkoutReservationResult } from '../../tables/checkoutReservations/validators/checkoutReservationValidators.js';

// TYPES
import type { Id } from '../../_generated/dataModel.js';

type CheckoutSnapshot = ObjectType<typeof checkoutReservationResult.fields>['checkout'];

/** Stripe metadata is a flat string map with values capped at 500 characters. */
function buildCheckoutMetadata(options: {
	reservationId: Id<'checkoutReservations'>;
	receiptToken: string;
	checkout: CheckoutSnapshot;
}) {
	const { checkout, reservationId, receiptToken } = options;
	const address = checkout.shippingAddress;

	return {
		reservationId,
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
		subtotalInCents: String(checkout.subtotalInCents),
		shippingInCents: String(checkout.shippingInCents),
		totalInCents: String(checkout.totalInCents),
		itemCount: String(checkout.items.length)
	};
}

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
		const reservation = await ctx.runMutation(
			internal.tables.checkoutReservations.mutations.createCheckoutReservation
				.createCheckoutReservation,
			{ ...orderArgs, receiptToken }
		);
		const { checkout } = reservation;
		const successUrl = new URL('/checkout/success', env.PUBLIC_ORIGIN);
		successUrl.searchParams.set('key', receiptToken);
		const metadata = buildCheckoutMetadata({
			reservationId: reservation.reservationId,
			receiptToken,
			checkout
		});

		let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>> | undefined;
		try {
			if (Object.values(metadata).some((value) => value.length > 500)) {
				throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
			}
			const stripeExpiresAt = Math.max(
				Math.ceil(reservation.expiresAt / 1000),
				Math.floor(Date.now() / 1000) + ORDER_CONFIG.checkoutReservationMinutes * 60
			);

			session = await stripe.checkout.sessions.create({
				mode: 'payment',
				adaptive_pricing: { enabled: false },
				integration_identifier: 'convex_checkout_hxqplmzr',
				customer_email: checkout.email,
				line_items: buildCheckoutLineItems(
					checkout.currency.toLowerCase(),
					checkout.items,
					checkout.shippingInCents
				),
				expires_at: stripeExpiresAt,
				metadata,
				success_url: successUrl.toString() + '&session_id={CHECKOUT_SESSION_ID}',
				cancel_url: new URL('/checkout', env.PUBLIC_ORIGIN).toString()
			});

			if (session.status !== 'open' || session.url === null) {
				throw new ConvexError<BackendErrorData>({ code: 'ORDER_PAYMENT_UNAVAILABLE' });
			}

			await ctx.runMutation(
				internal.tables.checkoutReservations.mutations.associateStripeCheckoutSession
					.associateStripeCheckoutSession,
				{
					reservationId: reservation.reservationId,
					stripeCheckoutSessionId: session.id,
					expiresAt: session.expires_at * 1000
				}
			);
			return { checkoutUrl: session.url };
		} catch (error) {
			await ctx
				.runMutation(
					internal.tables.checkoutReservations.mutations.releaseCheckoutReservation
						.releaseCheckoutReservation,
					{ reservationId: reservation.reservationId }
				)
				.catch(() => undefined);
			if (session?.status === 'open') {
				await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
			}
			throw error;
		}
	}
});
