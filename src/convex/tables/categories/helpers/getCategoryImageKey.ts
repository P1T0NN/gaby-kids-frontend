// HELPERS
import { invalidCategory } from './invalidCategory.js';

const CATEGORY_IMAGE_PREFIX = 'categories/';

function isCategoryImageKey(key: string): boolean {
	const filename = key.slice(CATEGORY_IMAGE_PREFIX.length);
	return key.startsWith(CATEGORY_IMAGE_PREFIX) && filename.length > 0 && !filename.includes('/');
}

export function getCategoryImageKey(
	uploadedFiles: readonly string[] | null | undefined,
	retainedFiles: readonly string[] | null | undefined,
	currentImageKey?: string
): string | undefined {
	const uploaded = uploadedFiles ?? [];
	const retained = retainedFiles ?? [];

	const hasInvalidRetainedImage =
		retained.length > 0 && (retained.length !== 1 || retained[0] !== currentImageKey);
	if (hasInvalidRetainedImage) {
		throw invalidCategory();
	}

	const imageKeys = [...uploaded, ...retained];
	const hasInvalidImageCount = imageKeys.length > 1;
	const hasInvalidImageKey = imageKeys.some((key) => !isCategoryImageKey(key));
	const hasInvalidCategoryImage = hasInvalidImageCount || hasInvalidImageKey;
	if (hasInvalidCategoryImage) {
		throw invalidCategory();
	}

	return uploaded[0] ?? retained[0];
}
