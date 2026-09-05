import { literals } from 'convex-helpers/validators';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

import { productStatus } from './tables/products/validators/productValidators.js';

export const tables = {
	categories: defineTable({
		name: v.string(),
		slug: v.string(),
		status: literals('active', 'archived'),
		imageKey: v.optional(v.string())
	})
		.searchIndex('search_name', { searchField: 'name' })
		.index('by_slug', ['slug'])
		.index('by_status', ['status']),
	products: defineTable({
		name: v.string(),
		slug: v.string(),
		description: v.string(),
		priceInCents: v.number(),
		categoryId: v.id('categories'),
		images: v.array(v.string()),
		imageKeys: v.array(v.string()),
		storagePrefix: v.string(),
		status: productStatus
	})
		.searchIndex('search_name', { searchField: 'name', filterFields: ['status'] })
		.index('by_slug', ['slug'])
		.index('by_category_id', ['categoryId'])
		.index('by_status', ['status']),
	storageUploads: defineTable({
		ownerId: v.string(),
		key: v.string(),
		expectedSize: v.optional(v.number()),
		expectedContentType: v.optional(v.string()),
		status: literals('pending', 'uploaded'),
		createdAt: v.number()
	})
		.index('by_key', ['key'])
		.index('by_owner_id_created_at', ['ownerId', 'createdAt'])
		.index('by_created_at', ['createdAt'])
};

export default defineSchema(tables);
