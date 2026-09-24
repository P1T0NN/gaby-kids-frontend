// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// TYPES
import type {
	ProductAgeGroup,
	ProductGender
} from '@/shared/features/products/types/productsTypes.js';

export const AGE_GROUP_LABELS = {
	kids: m['ProductsFeature.AgeGroupBadge.kids'],
	adults: m['ProductsFeature.AgeGroupBadge.adults']
} satisfies Record<ProductAgeGroup, () => string>;

export const GENDER_LABELS = {
	unisex: m['ProductsFeature.GenderBadge.unisex'],
	male: m['ProductsFeature.GenderBadge.male'],
	female: m['ProductsFeature.GenderBadge.female']
} satisfies Record<ProductGender, () => string>;
