// LIBRARIES
import { ConvexError } from 'convex/values';

// CONFIG
import { PRODUCTS_CONFIG } from '../../../../shared/features/products/config.js';

// HELPERS
import { getProductCategoryIds } from '../../products/helpers/getProductCategoryIds.js';
import { buildProductOptionKeys } from '../utils/buildProductOptionKeys.js';
import { readProductOptionIndexRows } from './readProductOptionIndexRows.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';
import type { ProductVariantOption } from '../../../../shared/features/productVariants/types/productVariantTypes.js';

type Product = Doc<'products'>;

/**
 * Rebuild a product's `productOptionIndex` rows after its variants are written.
 * Runs in the caller's transaction; one scope per category plus the global scope.
 */
export async function createProductOptionIndex({
	ctx,
	product,
	variants
}: {
	ctx: MutationCtx;
	product: Pick<
		Product,
		| '_id'
		| 'name'
		| 'status'
		| 'categoryId'
		| 'categoryIds'
		| 'ageGroup'
		| 'gender'
		| '_creationTime'
	>;
	variants: readonly { options: readonly ProductVariantOption[] }[];
}): Promise<void> {
	const keys = ['', ...buildProductOptionKeys(variants)];
	const scopes = [undefined, ...getProductCategoryIds(product)];
	const exceedsProjectionLimit =
		keys.length * scopes.length > PRODUCTS_CONFIG.MAX_OPTION_INDEX_ROWS;
	if (exceedsProjectionLimit)
		throw new ConvexError<BackendErrorData>({ code: 'INVALID_PRODUCT_DATA' });
	const existingRows = await readProductOptionIndexRows(ctx, product._id);

	for (const row of existingRows) {
		await ctx.db.delete(row._id);
	}

	for (const categoryId of scopes) {
		for (const optionKey of keys) {
			await ctx.db.insert('productOptionIndex', {
				productId: product._id,
				name: product.name,
				optionKey,
				status: product.status,
				categoryId,
				ageGroup: product.ageGroup,
				gender: product.gender,
				productCreatedAt: product._creationTime
			});
		}
	}
}
