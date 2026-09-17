// LIBRARIES
import { ConvexError } from 'convex/values';

// HELPERS
import { resolveProductVariantSku } from './resolveProductVariantSku.js';

// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';
import type {
	ProductVariantCaches,
	ProductVariantDraft,
	ProductVariantWriteFields,
	ProductVariantWrites
} from '../../../../shared/features/productVariants/types/productVariantTypes.js';

/**
 * Validate and plan the product variant writes for one save, plus the product
 * display caches derived from the incoming product variants. Existing rows are
 * streamed through the `by_product_id` index; deletion and stock guards run
 * here so the mutation never writes an inconsistent product.
 */
export async function resolveProductVariants(options: {
	ctx: MutationCtx;
	productId: Id<'products'> | undefined;
	input: ProductVariantDraft[];
	slug: string;
	trackInventory: boolean;
}): Promise<{ writes: ProductVariantWrites; caches: ProductVariantCaches }> {
	const productId = options.productId;
	const incomingIds = new Set(
		options.input.flatMap((productVariant) =>
			productVariant.id === undefined ? [] : [productVariant.id]
		)
	);
	const existingIds = new Set<Id<'productVariants'>>();
	const reservedById = new Map<Id<'productVariants'>, number>();
	const writes: ProductVariantWrites = { inserts: [], patches: [], deletes: [] };
	let totalReservedInventory = 0;

	if (productId !== undefined) {
		for await (const productVariant of options.ctx.db
			.query('productVariants')
			.withIndex('by_product_id', (query) => query.eq('productId', productId))) {
			existingIds.add(productVariant._id);
			totalReservedInventory += productVariant.reservedInventory;

			if (!incomingIds.has(productVariant._id)) {
				if (productVariant.reservedInventory > 0) {
					throw new ConvexError<BackendErrorData>({
						code: 'CANNOT_DELETE_RESERVED_PRODUCT_VARIANT'
					});
				}
				writes.deletes.push(productVariant._id);
				continue;
			}

			reservedById.set(productVariant._id, productVariant.reservedInventory);
		}
	}

	if (!options.trackInventory && totalReservedInventory > 0) {
		throw new ConvexError<BackendErrorData>({ code: 'CANNOT_DISABLE_INVENTORY_WITH_RESERVATIONS' });
	}

	const usedSkus = new Set<string>();
	for (const [position, productVariant] of options.input.entries()) {
		if (productVariant.id !== undefined) {
			if (!existingIds.has(productVariant.id)) {
				throw new ConvexError<BackendErrorData>({ code: 'INVALID_PRODUCT_VARIANT' });
			}
			if (productVariant.inventory < (reservedById.get(productVariant.id) ?? 0)) {
				throw new ConvexError<BackendErrorData>({
					code: 'PRODUCT_VARIANT_STOCK_BELOW_RESERVED'
				});
			}
		}

		const fields: ProductVariantWriteFields = {
			position,
			options: productVariant.options,
			sku: await resolveProductVariantSku({
				ctx: options.ctx,
				slug: options.slug,
				productVariant,
				position,
				usedSkus
			}),
			imageKeys: productVariant.imageKeys,
			priceInCents: productVariant.priceInCents,
			compareAtPriceInCents: productVariant.compareAtPriceInCents,
			inventory: productVariant.inventory
		};

		if (productVariant.id === undefined) {
			writes.inserts.push({ ...fields, reservedInventory: 0 });
		} else {
			writes.patches.push({ id: productVariant.id, fields });
		}
	}

	const prices = options.input.map((productVariant) => productVariant.priceInCents);
	const compareAtPrices = options.input.map(
		(productVariant) => productVariant.compareAtPriceInCents
	);
	const sharedCompareAtPrice = compareAtPrices[0];
	const hasSharedCompareAtPrice =
		sharedCompareAtPrice !== undefined &&
		compareAtPrices.every((price) => price === sharedCompareAtPrice);

	const caches: ProductVariantCaches = {
		priceInCents: Math.min(...prices),
		hasPriceRange: Math.min(...prices) !== Math.max(...prices)
	};
	if (hasSharedCompareAtPrice && sharedCompareAtPrice !== undefined) {
		caches.compareAtPriceInCents = sharedCompareAtPrice;
	}

	return { writes, caches };
}
