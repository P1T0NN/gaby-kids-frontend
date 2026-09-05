// SVELTEKIT IMPORTS
import { redirect } from '@sveltejs/kit';

// CONSTANTS
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

// TYPES
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { authState, currentUser } = await parent();

	if (!authState.isAuthenticated) {
		redirect(303, UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN);
	}

	if (currentUser?.role !== 'admin') {
		redirect(303, UNPROTECTED_PAGE_ENDPOINTS.ROOT);
	}

	return {};
};
