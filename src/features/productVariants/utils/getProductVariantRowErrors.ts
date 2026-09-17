// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// UTILS
import { priceInCents } from '@/shared/utils/pricing.js';
import { getProductVariantOptionKey } from '@/shared/features/productVariants/utils/getProductVariantOptionKey.js';
import { hasValidProductVariantDiscount } from '@/shared/features/productVariants/utils/hasValidProductVariantDiscount.js';

// TYPES
import type {
	ProductVariantFormValue,
	ProductVariantRowErrors
} from '@/shared/features/productVariants/types/productVariantTypes.js';

/** Live, localized validation for each product variant editor row. */
export function getProductVariantRowErrors(
	productVariants: readonly ProductVariantFormValue[]
): ProductVariantRowErrors[] {
	const rowErrors: ProductVariantRowErrors[] = productVariants.map(() => ({}));
	const skuCounts: Record<string, number> = {};
	for (const productVariant of productVariants) {
		const sku = productVariant.sku.trim().toLowerCase();
		if (sku) skuCounts[sku] = (skuCounts[sku] ?? 0) + 1;
	}
	const combinationCounts: Record<string, number> = {};
	for (const productVariant of productVariants) {
		if (productVariant.options.length === 0) continue;
		const combination = getProductVariantOptionKey(productVariant.options);
		combinationCounts[combination] = (combinationCounts[combination] ?? 0) + 1;
	}

	productVariants.forEach((productVariant, index) => {
		const rowError = rowErrors[index];

		if (productVariant.options.some((option) => !option.value.trim())) {
			rowError.options =
				m['ProductVariantsFeature.ProductVariantsEditorVariantRow.optionValueRequired']();
		}

		const sku = productVariant.sku.trim().toLowerCase();
		if (sku && (skuCounts[sku] ?? 0) > 1) {
			rowError.sku = m['ProductVariantsFeature.ProductVariantsEditorVariantRow.skuDuplicate']();
		}

		const regularPriceInCents = priceInCents(productVariant.price);
		const hasRegularPrice =
			productVariant.price.trim() !== '' &&
			Number.isSafeInteger(regularPriceInCents) &&
			regularPriceInCents > 0;
		if (!hasRegularPrice) {
			rowError.price = m['ProductVariantsFeature.ProductVariantsEditorVariantRow.priceRequired']();
		}

		if (productVariant.discountedPrice.trim() !== '') {
			const discountedPriceInCents = priceInCents(productVariant.discountedPrice);
			const hasValidDiscountedPrice =
				Number.isSafeInteger(discountedPriceInCents) &&
				discountedPriceInCents > 0 &&
				(!hasRegularPrice ||
					hasValidProductVariantDiscount(regularPriceInCents, discountedPriceInCents));
			if (!hasValidDiscountedPrice) {
				rowError.discountedPrice =
					m['ProductVariantsFeature.ProductVariantsEditorVariantRow.discountedPriceInvalid']();
			}
		}

		const inventory = Number(productVariant.inventory);
		if (productVariant.inventory.trim() === '' || !Number.isInteger(inventory) || inventory < 0) {
			rowError.inventory =
				m['ProductVariantsFeature.ProductVariantsEditorVariantRow.stockInvalid']();
		} else if (inventory < productVariant.reservedInventory) {
			rowError.inventory = m[
				'ProductVariantsFeature.ProductVariantsEditorVariantRow.stockBelowReserved'
			]({
				count: productVariant.reservedInventory
			});
		}

		if (
			productVariant.options.length > 0 &&
			(combinationCounts[getProductVariantOptionKey(productVariant.options)] ?? 0) > 1
		) {
			rowError.combination = m['ValidationMessages.duplicateProductVariant']();
		}
	});

	return rowErrors;
}
