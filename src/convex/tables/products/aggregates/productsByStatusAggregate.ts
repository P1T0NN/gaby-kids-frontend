// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel, Doc } from '../../../_generated/dataModel.js';

export const productsByStatusAggregate = new TableAggregate<{
	Key: number;
	DataModel: DataModel;
	TableName: 'products';
	Namespace: Doc<'products'>['status'];
}>(components.productsAggregate, {
	namespace: (product) => product.status,
	sortKey: (product) => product._creationTime
});
