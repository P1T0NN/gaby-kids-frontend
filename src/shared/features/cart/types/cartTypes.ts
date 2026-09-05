// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

export type CartProduct = Pick<Doc<'products'>, 'name'> & {
	id: Doc<'products'>['_id'];
	priceInCents: number;
};

export type CartItem = {
	id: string;
	image: string;
	quantity: number;
};
