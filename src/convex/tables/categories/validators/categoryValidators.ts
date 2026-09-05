// LIBRARIES
import { v } from 'convex/values';

const categoryStatus = v.union(v.literal('active'), v.literal('archived'));

export const categoryResult = v.object({
	_id: v.id('categories'),
	_creationTime: v.number(),
	name: v.string(),
	slug: v.string(),
	status: categoryStatus,
	imageKey: v.optional(v.string()),
	image: v.optional(v.string())
});

export const categoryAdminResult = categoryResult;

export const categoryOption = v.object({
	_id: v.id('categories'),
	name: v.string(),
	slug: v.string(),
	status: categoryStatus
});

export const categoryOptions = v.array(categoryOption);

export const categoryPage = v.object({
	items: v.array(categoryAdminResult),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.optional(v.number())
});
