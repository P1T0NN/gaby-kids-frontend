// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// TYPES
import type { Doc, Id } from '../../../_generated/dataModel.js';

export type CheckoutLine = {
	productId: Id<'products'>;
	name: string;
	unitPriceInCents: number;
	quantity: number;
	imageUrl: string;
};

/** Build the trusted checkout line (with its resolved thumbnail) for one product. */
export async function buildCheckoutLine(
	product: Doc<'products'>,
	quantity: number
): Promise<CheckoutLine> {
	const imageKey = (product.imageKeys ?? product.images)[0];
	const imageUrl = imageKey ? (await resolveStoredFileUrls([imageKey]))[0] : undefined;

	return {
		productId: product._id,
		name: product.name,
		unitPriceInCents: product.priceInCents,
		quantity,
		imageUrl: imageUrl ?? ''
	};
}
