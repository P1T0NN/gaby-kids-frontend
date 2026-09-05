// SVELTEKIT IMPORTS
import { redirect } from '@sveltejs/kit';

// CONSTANTS
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

// TYPES
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
	// SAFETY: The root server layout always provides authState; this orphaned route group has no
	// leaf yet, so SvelteKit temporarily generates an empty parent-data type until one is added.
	const { authState } = (await parent()) as { authState: { isAuthenticated: boolean } };

	if (!authState.isAuthenticated) {
		redirect(303, UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN);
	}

	return {};
};
