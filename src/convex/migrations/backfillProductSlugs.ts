import { generateSlug } from '../../shared/utils/generateSlug.js';

import { migrations } from './migrations.js';

export const backfillProductSlugs = migrations.define({
	table: 'products',
	migrateOne: async (_ctx, product) =>
		product.slug === undefined ? { slug: generateSlug(product.name) } : undefined
});
