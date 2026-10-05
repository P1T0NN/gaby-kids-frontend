// SVELTEKIT IMPORTS
import { redirect } from '@sveltejs/kit';

// CONFIG
import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
import { COUPONS_CONFIG } from '@/shared/features/coupons/config.js';

// TYPES
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	if (!COUPONS_CONFIG.HAS_COUPONS) redirect(307, ADMIN_PAGE_ENDPOINTS.DASHBOARD);
	return {};
};
