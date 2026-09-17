// LIBRARIES
import { v } from 'convex/values';

// VALIDATORS
import { pageValidator } from '../../../validators/pageValidator.js';

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

export const categoryPage = pageValidator(categoryAdminResult);
