// LIBRARIES
import { m } from '@/lib/paraglide/messages';

export const FALLBACK = () => m['ValidationMessages.fallback']();

export const MESSAGES: [RegExp, () => string][] = [
	[
		/^COMPARE_AT_PRICE_MUST_EXCEED_PRICE$/,
		() => m['ValidationMessages.compareAtPriceMustExceedPrice']()
	],
	[
		/^DUPLICATE_PRODUCT_VARIANT_OPTION$/,
		() => m['ValidationMessages.duplicateProductVariantOption']()
	],
	[/^DUPLICATE_PRODUCT_VARIANT$/, () => m['ValidationMessages.duplicateProductVariant']()],
	[/^INVALID_PRODUCT_VARIANT$/, () => m['ValidationMessages.invalidProductVariant']()],
	[/^PRODUCT_VARIANT_IMAGE_REQUIRED$/, () => m['ValidationMessages.productVariantImageRequired']()],
	[/expected string, received undefined/, () => m['ValidationMessages.requiredValue']()],
	[/expected .+?, received undefined/, () => m['ValidationMessages.requiredField']()],
	[/Too small/, () => m['ValidationMessages.validValue']()]
];
