import { getProductCategoryIds } from '../helpers/getProductCategoryIds.js';

// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// VALIDATORS
import { productResult } from '../validators/productValidators.js';

// TYPES
import type { Infer } from 'convex/values';
import type { Doc } from '../../../_generated/dataModel.js';

type Product = Doc<'products'>;
type ProductResult = Infer<typeof productResult>;

export const toProductResult = async (product: Product): Promise<ProductResult> => {
	const result = {
		_id: product._id,
		_creationTime: product._creationTime,
		name: product.name,
		slug: product.slug,
		description: product.description,
		productVariantOptionNames: product.productVariantOptionNames,
		priceInCents: product.priceInCents ?? 0,
		hasPriceRange: product.hasPriceRange,
		categoryIds: getProductCategoryIds(product),
		categoryId: getProductCategoryIds(product)[0],
		ageGroup: product.ageGroup,
		gender: product.gender,
		images: await resolveStoredFileUrls(product.imageKeys),
		imageKeys: product.imageKeys,
		storagePrefix: product.storagePrefix,
		trackInventory: product.trackInventory,
		upsellProductIds: product.upsellProductIds,
		status: product.status
	};

	if (product.compareAtPriceInCents === undefined) return result;

	return { ...result, compareAtPriceInCents: product.compareAtPriceInCents };
};
