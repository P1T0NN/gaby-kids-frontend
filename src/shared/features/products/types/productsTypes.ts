// DATA
import { PRODUCT_AGE_GROUPS, PRODUCT_GENDERS } from '../data/productsData.js';

// TYPES
import type { DataModel, Doc } from '../../../../convex/_generated/dataModel.js';
import type { NamedTableInfo, OrderedQuery } from 'convex/server';

export type ProductAgeGroup = (typeof PRODUCT_AGE_GROUPS)[number];

export type ProductGender = (typeof PRODUCT_GENDERS)[number];

export type ProductQuery = OrderedQuery<NamedTableInfo<DataModel, 'products'>>;

/** API-shaped product: stored fields plus the resolved display image URLs. */
export type ProductResult = Doc<'products'> & { images: string[] };

export type ProductAvailability =
	| { type: 'unlimited' }
	| { type: 'available'; quantity: number }
	| { type: 'sold_out' }
	| { type: 'temporarily_unavailable' };
