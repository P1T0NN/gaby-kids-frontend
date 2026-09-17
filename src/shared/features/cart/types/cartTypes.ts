// TYPES
import type { Doc, Id } from '../../../../convex/_generated/dataModel.js';

export type CartProductVariant = Pick<
	Doc<'productVariants'>,
	'priceInCents' | 'compareAtPriceInCents' | 'inventory' | 'reservedInventory'
> & {
	id: Id<'productVariants'>;
	productId: Id<'products'>;
	name: string;
	productVariantLabel: string;
	image?: string;
	trackInventory: boolean;
};

export type CartItem = {
	productVariantId: string;
	image: string;
	quantity: number;
};
