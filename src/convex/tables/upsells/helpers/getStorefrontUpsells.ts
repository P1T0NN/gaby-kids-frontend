// CONFIG
import { UPSELLS_CONFIG } from '../../../../shared/features/upsells/config.js';

// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';

export async function getStorefrontUpsells(ctx: QueryCtx, product: Doc<'products'>) {
	const recommendations = await Promise.all(
		(product.upsellProductIds ?? [])
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
			images: await resolveStoredFileUrls((upsell.imageKeys ?? upsell.images).slice(0, 1))
		}))
	);
}
