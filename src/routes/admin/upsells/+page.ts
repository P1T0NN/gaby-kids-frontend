// SVELTEKIT IMPORTS
import { redirect } from '@sveltejs/kit';

// CONFIG
import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
import { UPSELLS_CONFIG } from '@/shared/features/upsells/config.js';

// TYPES
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	if (!UPSELLS_CONFIG.HAS_UPSELLS) redirect(307, ADMIN_PAGE_ENDPOINTS.DASHBOARD);
	return {};
};
