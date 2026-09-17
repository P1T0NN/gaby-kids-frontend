export const PRODUCT_VARIANTS_CONFIG = {
	/** Variants removed per scheduled cleanup transaction when a product is deleted. */
	DELETION_BATCH_SIZE: 100,
	MAX_OPTION_COUNT: 3,
	MAX_OPTION_NAME_LENGTH: 50,
	MAX_OPTION_VALUE_LENGTH: 100,
	MAX_SKU_LENGTH: 64
} as const;
