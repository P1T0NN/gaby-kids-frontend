'use node';

// LIBRARIES
import Stripe from 'stripe';

// CONVEX
import { env } from '../_generated/server.js';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: '2026-08-26.dahlia'
});
