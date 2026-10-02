// LIBRARIES
import { Triggers } from 'convex-helpers/server/triggers';

// AGGREGATES
import { categoryAggregate } from '../tables/categories/aggregates/categoryAggregate.js';
import { productsByCategoryAggregate } from '../tables/categories/aggregates/productsByCategoryAggregate.js';
import { productAggregate } from '../tables/products/aggregates/productAggregate.js';
import { productsByStatusAggregate } from '../tables/products/aggregates/productsByStatusAggregate.js';
import { orderAggregate } from '../tables/orders/aggregates/orderAggregate.js';

// HELPERS
import { applyOrderChangeToDailySales } from '../analytics/helpers/applyOrderToDailySales.js';
import { getProductCategoryIds } from '../tables/products/helpers/getProductCategoryIds.js';

// TYPES
import type { DataModel } from '../_generated/dataModel.js';

const aggregateTriggers = new Triggers<DataModel>();

aggregateTriggers.register('products', productAggregate.idempotentTrigger());
aggregateTriggers.register('products', productsByStatusAggregate.idempotentTrigger());
aggregateTriggers.register('products', async (ctx, change) => {
	const previous = change.oldDoc ? getProductCategoryIds(change.oldDoc) : [];
	const next = change.newDoc ? getProductCategoryIds(change.newDoc) : [];
	for (const namespace of previous) {
		if (!next.includes(namespace)) {
			await productsByCategoryAggregate.deleteIfExists(ctx, {
				namespace,
				key: change.oldDoc!._creationTime,
				id: change.id
			});
		}
	}
	for (const namespace of next) {
		await productsByCategoryAggregate.insertIfDoesNotExist(ctx, {
			namespace,
			key: change.newDoc!._creationTime,
			id: change.id
		});
	}
});
aggregateTriggers.register('categories', categoryAggregate.idempotentTrigger());
aggregateTriggers.register('orders', orderAggregate.idempotentTrigger());
aggregateTriggers.register('orders', async (ctx, change) => {
	await applyOrderChangeToDailySales(ctx, change.oldDoc, change.newDoc);
});

export { aggregateTriggers };
