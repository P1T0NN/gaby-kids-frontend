// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// UTILS
import { getProductVariantLabel } from '../../../../shared/features/productVariants/utils/getProductVariantLabel.js';

// TYPES
import type { Doc, Id } from '../../../_generated/dataModel.js';

export type CheckoutLine = {
	productId: Id<'products'>;
	productVariantId: Id<'productVariants'>;
	name: string;
	productVariantLabel: string;
	sku: string;
	unitPriceInCents: number;
	quantity: number;
	imageUrl: string;
};

/** Build the trusted checkout line (with its resolved thumbnail) for one product variant. */
export async function buildCheckoutLine(
	product: Doc<'products'>,
	productVariant: Doc<'productVariants'>,
	quantity: number
): Promise<CheckoutLine> {
	const imageKey = productVariant.imageKeys[0] ?? (product.imageKeys ?? product.images)[0];
	const imageUrl = imageKey ? (await resolveStoredFileUrls([imageKey]))[0] : undefined;

	return {
		productId: product._id,
		productVariantId: productVariant._id,
		name: product.name,
		productVariantLabel: getProductVariantLabel(productVariant.options),
		sku: productVariant.sku,
		unitPriceInCents: productVariant.priceInCents,
		quantity,
		imageUrl: imageUrl ?? ''
	};
}
