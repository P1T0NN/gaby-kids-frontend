'use node';

// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { env, internalAction } from '../../_generated/server.js';

// CONFIG
import { stripe } from '../stripe.config.js';

export const verifyStripeWebhook = internalAction({
	args: {
		payload: v.string(),
		signature: v.string()
	},
	returns: v.object({ id: v.string(), type: v.string() }),
	handler: async (_ctx, { payload, signature }) => {
		const event = await stripe.webhooks.constructEventAsync(
			payload,
			signature,
			env.STRIPE_WEBHOOK_SECRET
		);

		return { id: event.id, type: event.type };
	}
});
