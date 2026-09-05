// LIBRARIES
import { Triggers } from 'convex-helpers/server/triggers';

// AGGREGATES
import { categoryAggregate } from '../tables/categories/aggregates/categoryAggregate.js';
import { productsByCategoryAggregate } from '../tables/categories/aggregates/productsByCategoryAggregate.js';
import { productAggregate } from '../tables/products/aggregates/productAggregate.js';
import { productsByStatusAggregate } from '../tables/products/aggregates/productsByStatusAggregate.js';

// TYPES
import type { DataModel } from '../_generated/dataModel.js';

const aggregateTriggers = new Triggers<DataModel>();

aggregateTriggers.register('products', productAggregate.idempotentTrigger());
aggregateTriggers.register('products', productsByStatusAggregate.idempotentTrigger());
aggregateTriggers.register('products', productsByCategoryAggregate.idempotentTrigger());
aggregateTriggers.register('categories', categoryAggregate.idempotentTrigger());

export { aggregateTriggers };
