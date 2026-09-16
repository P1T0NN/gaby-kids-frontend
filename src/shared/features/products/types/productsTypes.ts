// TYPES
import type { DataModel } from '../../../../convex/_generated/dataModel.js';
import type { NamedTableInfo, OrderedQuery } from 'convex/server';

export type ProductQuery = OrderedQuery<NamedTableInfo<DataModel, 'products'>>;

export type ProductAvailability =
	| { type: 'unlimited' }
	| { type: 'available'; quantity: number }
	| { type: 'sold_out' }
	| { type: 'temporarily_unavailable' };
