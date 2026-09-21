// TYPES
import type { ProductAgeGroup, ProductGender } from './types/productsTypes.js';

export const PRODUCTS_CONFIG = {
	HAS_PRODUCT_PAGE: true,
	NEW_PRODUCT_WINDOW_MS: 14 * 24 * 60 * 60 * 1000,
	LOW_STOCK_THRESHOLD: 5,
	/**
	 * Optional product attributes. The columns always exist as optional fields; flipping a flag to
	 * false only hides it from the admin form and the shop filters.
	 */
	HAS_AGE_GROUP: true,
	HAS_GENDER: true
} as const;

export const DEFAULT_PRODUCT_AGE_GROUP: ProductAgeGroup = 'adults';

export const DEFAULT_PRODUCT_GENDER: ProductGender = 'unisex';
