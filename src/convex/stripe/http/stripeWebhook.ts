// CONVEX
import { internal } from '../../_generated/api.js';
import { httpAction } from '../../_generated/server.js';

export const stripeWebhook = httpAction(async (ctx, request) => {
	const signature = request.headers.get('stripe-signature');
	if (!signature) return new Response('Missing Stripe signature', { status: 400 });

	try {
		await ctx.runAction(internal.stripe.actions.verifyStripeWebhook.verifyStripeWebhook, {
			payload: await request.text(),
			signature
		});
		return new Response(null, { status: 200 });
	} catch {
		return new Response('Invalid Stripe webhook', { status: 400 });
	}
});
