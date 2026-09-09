// SVELTEKIT IMPORTS
import { redirect } from '@sveltejs/kit';

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
import { PRODUCTS_CONFIG } from '@/shared/features/products/config.js';

// TYPES
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	if (!PRODUCTS_CONFIG.HAS_PRODUCT_PAGE) redirect(307, UNPROTECTED_PAGE_ENDPOINTS.SHOP);
	return {};
};
