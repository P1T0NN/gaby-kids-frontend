import { v } from 'convex/values';

import { productResult } from '../../products/validators/productValidators.js';

// VALIDATORS
import { pageValidator } from '../../../validators/pageValidator.js';

export const upsellProductResult = v.object({
	productId: v.id('products'),
	product: v.union(productResult, v.null())
});

export const upsellsAdminPage = pageValidator(
	v.object({ product: productResult, upsells: v.array(upsellProductResult) })
);
