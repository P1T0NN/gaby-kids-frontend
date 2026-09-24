/**
 * Optional upsell recommendations. Flipping the flag to false hides the admin section and the
 * storefront upsells, and the storefront product query returns none.
 */
export const UPSELLS_CONFIG = {
	HAS_UPSELLS: true,
	maxProducts: 4
} as const;
