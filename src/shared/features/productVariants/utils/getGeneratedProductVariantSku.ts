// CONFIG
import { PRODUCT_VARIANTS_CONFIG } from '../config.js';

// UTILS
import { generateSlug } from '../../../utils/generateSlug.js';

/** The automatic SKU for a product variant: product slug plus option values, slugified. */
export function getGeneratedProductVariantSku(options: {
	slug: string;
	optionValues: readonly string[];
	position: number;
}): string {
	return (
		generateSlug(`${options.slug} ${options.optionValues.join(' ')}`)
			.slice(0, PRODUCT_VARIANTS_CONFIG.MAX_SKU_LENGTH)
			.replace(/-+$/g, '') || `product-${options.position + 1}`
	);
}
