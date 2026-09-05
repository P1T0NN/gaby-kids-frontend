import { env } from '$env/dynamic/public';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api.js';

/** Create a request-scoped client; ConvexHttpClient queues mutations internally. */
export function getConvexClient(): ConvexHttpClient {
	const url = env.PUBLIC_CONVEX_URL;
	if (!url) throw new Error('Missing PUBLIC_CONVEX_URL');
	return new ConvexHttpClient(url);
}

export { api };
