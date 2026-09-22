// LIBRARIES
import { ConvexError } from 'convex/values';

// UTILS
import { getGeneratedProductVariantSku } from '../../../../shared/features/productVariants/utils/getGeneratedProductVariantSku.js';

// HELPERS
import { isProductVariantSkuTaken } from './isProductVariantSkuTaken.js';

// TYPES
import type { QueryCtx } from '../../../_generated/server.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';
import type { ProductVariantDraft } from '../../../../shared/features/productVariants/types/productVariantTypes.js';

/** Typed SKUs must be unique; blank SKUs get a slug-based one with a numeric suffix. */
export async function resolveProductVariantSku(options: {
	ctx: QueryCtx;
	slug: string;
	productVariant: ProductVariantDraft;
	position: number;
	usedSkus: Set<string>;
}): Promise<string> {
	const typedSku = options.productVariant.sku.trim();
	const base =
		typedSku ||
		getGeneratedProductVariantSku({
			slug: options.slug,
			optionValues: options.productVariant.options.map((option) => option.value),
			position: options.position
		});

	let candidate = base;
	let suffix = 2;
	while (
		options.usedSkus.has(candidate) ||
		(await isProductVariantSkuTaken(options.ctx, candidate, options.productVariant.id))
	) {
		if (typedSku) {
			throw new ConvexError<BackendErrorData>({ code: 'PRODUCT_VARIANT_SKU_TAKEN' });
		}
		candidate = `${base}-${suffix}`;
		suffix += 1;
	}

	options.usedSkus.add(candidate);
	return candidate;
}
