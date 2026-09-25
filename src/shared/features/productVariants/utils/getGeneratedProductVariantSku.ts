// CONFIG
import { PRODUCT_VARIANTS_CONFIG } from '../config.js';

// UTILS
import { generateSlug } from '../../../utils/generateSlug.js';

/** Words too generic to tell products apart; skipped before abbreviating. */
const SKIPPED_WORDS = new Set([
	'de',
	'del',
	'con',
	'la',
	'el',
	'los',
	'las',
	'y',
	'en',
	'para',
	'un',
	'una'
]);

const MAX_PRODUCT_WORDS = 4;
const MAX_OPTION_WORDS = 2;
const WORD_LENGTH = 3;

/** Uppercases the first letters of the first significant words: "bata de organza" -> "BAT-ORG". */
function abbreviateWords(value: string, maxWords: number): string {
	return generateSlug(value)
		.split('-')
		.filter((word) => word.length > 0 && !SKIPPED_WORDS.has(word))
		.slice(0, maxWords)
		.map((word) => word.slice(0, WORD_LENGTH).toUpperCase())
		.join('-');
}

/** The automatic SKU for a product variant: a compact code from the product slug plus option values. */
export function getGeneratedProductVariantSku(options: {
	slug: string;
	optionValues: readonly string[];
	position: number;
}): string {
	const skuParts = [
		abbreviateWords(options.slug, MAX_PRODUCT_WORDS),
		...options.optionValues.map((optionValue) => abbreviateWords(optionValue, MAX_OPTION_WORDS))
	].filter((part) => part.length > 0);

	return (
		skuParts.join('-').slice(0, PRODUCT_VARIANTS_CONFIG.MAX_SKU_LENGTH) ||
		`product-${options.position + 1}`
	);
}
