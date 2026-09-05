// SVELTEKIT IMPORTS
import { PUBLIC_ORIGIN } from '$env/static/public';

// LIBRARIES
import { createAuthClient } from 'better-auth/svelte';
import { adminClient, emailOTPClient } from 'better-auth/client/plugins';
import { convexClient } from '@convex-dev/better-auth/client/plugins';

export const authClient = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	baseURL: PUBLIC_ORIGIN,
	sessionOptions: {
		refetchOnWindowFocus: false
	},
	plugins: [adminClient(), emailOTPClient(), convexClient()]
});

// Convenience shortcuts from the SAME client — a second createAuthClient() call
// would create an independent instance with its own state.
// Convenience shortcuts from the SAME client — a second createAuthClient() call
// would create an independent instance with its own state.
export const { signIn, signUp, useSession } = authClient;
