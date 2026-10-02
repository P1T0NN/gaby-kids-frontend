// TYPES
import type { Doc, Id } from '../../../_generated/dataModel.js';

/** Read legacy products until the category-array backfill has completed. */
export function getProductCategoryIds(
	product: Pick<Doc<'products'>, 'categoryIds' | 'categoryId'>
): Id<'categories'>[] {
	return product.categoryIds ?? (product.categoryId ? [product.categoryId] : []);
}
