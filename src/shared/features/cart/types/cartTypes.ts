// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

export type CartProduct = Pick<
	Doc<'products'>,
	'name' | 'compareAtPriceInCents' | 'trackInventory' | 'inventory' | 'reservedInventory'
> & {
	id: Doc<'products'>['_id'];
	priceInCents: number;
};

export type CartItem = {
	id: string;
	image: string;
	quantity: number;
};
