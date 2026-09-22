// LIBRARIES
import { api } from '@convex/_generated/api';

// UTILS
import { getGeneratedProductVariantSku } from '@/shared/features/productVariants/utils/getGeneratedProductVariantSku.js';

// TYPES
import type { FunctionReturnType } from 'convex/server';
import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

export type ProductDetail = FunctionReturnType<
	typeof api.tables.products.queries.fetchProductById.fetchProductById
>;

/** Hydrates one stored product variant into the editable form model. */
export function toProductVariantFormValue(options: {
	productVariant: ProductDetail['productVariants'][number];
	index: number;
	slug: string;
}): ProductVariantFormValue {
	const { productVariant, index, slug } = options;
	const generatedSku = getGeneratedProductVariantSku({
		slug,
		optionValues: productVariant.options.map((option) => option.value),
		position: index
	});

	return {
		id: productVariant._id,
		options: productVariant.options.map((option) => ({ ...option })),
		// An untouched automatic SKU stays blank so the editor keeps showing the live preview.
		sku: productVariant.sku === generatedSku ? '' : productVariant.sku,
		skuOverridden: false,
		imageKeys: [...productVariant.imageKeys],
		priceInCents: productVariant.priceInCents,
		compareAtPriceInCents: productVariant.compareAtPriceInCents,
		inventory: productVariant.inventory,
		reservedInventory: productVariant.reservedInventory
	};
}
