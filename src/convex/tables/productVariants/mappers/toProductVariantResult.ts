// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// VALIDATORS
import { productVariantResult } from '../validators/productVariantValidators.js';

// TYPES
import type { Infer } from 'convex/values';
import type { Doc } from '../../../_generated/dataModel.js';

type ProductVariant = Doc<'productVariants'>;
type ProductVariantResult = Infer<typeof productVariantResult>;

export const toProductVariantResult = async (
	productVariant: ProductVariant
): Promise<ProductVariantResult> => ({
	_id: productVariant._id,
	_creationTime: productVariant._creationTime,
	productId: productVariant.productId,
	position: productVariant.position,
	options: productVariant.options,
	sku: productVariant.sku,
	imageKeys: productVariant.imageKeys,
	images: await resolveStoredFileUrls(productVariant.imageKeys),
	priceInCents: productVariant.priceInCents,
	compareAtPriceInCents: productVariant.compareAtPriceInCents,
	inventory: productVariant.inventory,
	reservedInventory: productVariant.reservedInventory
});
