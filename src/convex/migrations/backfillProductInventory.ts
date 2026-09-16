import { migrations } from './migrations.js';

export const backfillProductInventory = migrations.define({
	table: 'products',
	migrateOne: async (_ctx, product) => ({
		trackInventory: product.trackInventory ?? true,
		inventory: product.inventory ?? 0,
		reservedInventory: product.reservedInventory ?? 0,
		upsellProductIds: product.upsellProductIds ?? []
	})
});
