// TYPES
import type { Id } from '../../../../convex/_generated/dataModel.js';

export type ProductVariantOption = {
	name: string;
	value: string;
};

export type ProductVariantDraft = {
	id?: Id<'productVariants'>;
	options: ProductVariantOption[];
	sku: string;
	imageKeys: string[];
	priceInCents: number;
	compareAtPriceInCents?: number;
	inventory: number;
};

export type ProductVariantWriteFields = {
	position: number;
	options: ProductVariantOption[];
	sku: string;
	imageKeys: string[];
	priceInCents: number;
	compareAtPriceInCents: number | undefined;
	inventory: number;
};

export type ProductVariantWrites = {
	inserts: (ProductVariantWriteFields & { reservedInventory: number })[];
	patches: { id: Id<'productVariants'>; fields: ProductVariantWriteFields }[];
	deletes: Id<'productVariants'>[];
};

/** Form-level draft of one product variant; prices are major-unit input strings. */
export type ProductVariantFormValue = {
	/** Stored product variant ID; empty for a new product variant. */
	id: string;
	options: ProductVariantOption[];
	sku: string;
	/** Assigned library image references; stored keys, or preview IDs for new uploads. */
	imageKeys: string[];
	price: string;
	discountedPrice: string;
	inventory: string;
	reservedInventory: number;
};

/** Bounded per-product stock summary for listing pages. */
export type ProductVariantSummary = {
	count: number;
	inventory: number;
	reservedInventory: number;
	/** Present only when the product has exactly one product variant. */
	defaultProductVariantId?: Id<'productVariants'>;
};

export type ProductVariantErrorField =
	'options' | 'sku' | 'price' | 'discountedPrice' | 'inventory' | 'combination';

export type ProductVariantRowErrors = Partial<Record<ProductVariantErrorField, string>>;

export type ProductVariantCaches = {
	priceInCents: number;
	compareAtPriceInCents?: number;
	hasPriceRange: boolean;
};
