// CONFIG
import { UPSELLS_CONFIG } from '../../../../shared/features/upsells/config.js';

// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// HELPERS
import { getProductVariantSummary } from '../../productVariants/helpers/getProductVariantSummary.js';

// VALIDATORS
import { storefrontUpsellResult } from '../../products/validators/productValidators.js';

// TYPES
import type { Infer } from 'convex/values';
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';

type StorefrontUpsell = Infer<typeof storefrontUpsellResult>;

export async function getStorefrontUpsells(
	ctx: QueryCtx,
	product: Doc<'products'>
): Promise<StorefrontUpsell[]> {
	const recommendations = await Promise.all(
		product.upsellProductIds
			.slice(0, UPSELLS_CONFIG.maxProducts)
			.map((id) => ctx.db.get('products', id))
	);

	const activeRecommendations = recommendations.filter(
		(upsell): upsell is NonNullable<typeof upsell> =>
			upsell !== null && upsell.status === 'active' && upsell._id !== product._id
	);

	return Promise.all(
		activeRecommendations.map(async (upsell) => ({
			_id: upsell._id,
			name: upsell.name,
			slug: upsell.slug,
			priceInCents: upsell.priceInCents,
			compareAtPriceInCents: upsell.compareAtPriceInCents,
			hasPriceRange: upsell.hasPriceRange,
			images: await resolveStoredFileUrls((upsell.imageKeys ?? upsell.images).slice(0, 1)),
			trackInventory: upsell.trackInventory,
			productVariantSummary: await getProductVariantSummary(ctx, upsell._id)
		}))
	);
}
