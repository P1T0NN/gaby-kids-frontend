import { migrations } from './migrations.js';

export const backfillRequiredProductFields = migrations.define({
	table: 'products',
	migrateOne: async (_ctx, product) => ({
		priceInCents: product.priceInCents ?? 1,
		imageKeys: product.imageKeys ?? product.images,
		storagePrefix: product.storagePrefix ?? 'products'
	})
});
