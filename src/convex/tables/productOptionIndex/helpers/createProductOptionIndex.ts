// HELPERS
import { buildProductOptionKeys } from '../utils/buildProductOptionKeys.js';
import { readProductOptionIndexRows } from './readProductOptionIndexRows.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';
import type { ProductVariantOption } from '../../../../shared/features/productVariants/types/productVariantTypes.js';

type Product = Doc<'products'>;

/**
 * Rebuild a product's `productOptionIndex` rows after its variants are written.
 * Runs in the caller's transaction; a few small writes per product save.
 */
export async function createProductOptionIndex({
	ctx,
	product,
	variants
}: {
	ctx: MutationCtx;
	product: Pick<
		Product,
		'_id' | 'name' | 'status' | 'categoryId' | 'ageGroup' | 'gender' | '_creationTime'
	>;
	variants: readonly { options: readonly ProductVariantOption[] }[];
}): Promise<void> {
	const keys = buildProductOptionKeys(variants);
	const existingRows = await readProductOptionIndexRows(ctx, product._id);

	for (const row of existingRows) {
		await ctx.db.delete(row._id);
	}

	for (const optionKey of keys) {
		await ctx.db.insert('productOptionIndex', {
			productId: product._id,
			name: product.name,
			optionKey,
			status: product.status,
			categoryId: product.categoryId,
			ageGroup: product.ageGroup,
			gender: product.gender,
			productCreatedAt: product._creationTime
		});
	}
}
