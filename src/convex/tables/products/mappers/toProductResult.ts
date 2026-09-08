// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';

type Product = Doc<'products'>;

export const toProductResult = async (product: Product) => {
	const result = {
		_id: product._id,
		_creationTime: product._creationTime,
		name: product.name,
		slug: product.slug,
		description: product.description,
		priceInCents: product.priceInCents ?? 0,
		categoryId: product.categoryId,
		images: await resolveStoredFileUrls(product.imageKeys ?? product.images),
		imageKeys: product.imageKeys ?? product.images,
		storagePrefix: product.storagePrefix,
		upsellProductIds: product.upsellProductIds ?? [],
		status: product.status
	};

	return result;
};
