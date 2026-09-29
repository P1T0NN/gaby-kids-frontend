// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// VALIDATORS
import { categoryResult } from '../validators/categoryValidators.js';

// TYPES
import type { Infer } from 'convex/values';
import type { Doc } from '../../../_generated/dataModel.js';

type Category = Doc<'categories'>;
type CategoryResult = Infer<typeof categoryResult>;

/** Resolve the stored image key to a display url; rows without a key carry no image. */
export const toCategoryResult = async (category: Category): Promise<CategoryResult> => {
	const result = {
		_id: category._id,
		_creationTime: category._creationTime,
		name: category.name,
		slug: category.slug,
		status: category.status
	};

	if (category.imageKey === undefined) return result;

	const image = (await resolveStoredFileUrls([category.imageKey]))[0];
	return { ...result, imageKey: category.imageKey, image };
};
