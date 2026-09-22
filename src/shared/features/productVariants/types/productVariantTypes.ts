// TYPES
import type { Id } from '../../../../convex/_generated/dataModel.js';

export type ProductVariantOption = {
	name: string;
	value: string;
};

/** Anything carrying the structured option rows of one product variant. */
export type ProductVariantOptions = {
	options: readonly ProductVariantOption[];
};

/** Option rows plus the stock fields needed to judge whether a value can be picked. */
export type ProductVariantOptionCandidate = ProductVariantOptions & {
	inventory: number;
	reservedInventory: number;
};

export type ProductVariantOptionGroup = {
	name: string;
	values: string[];
};

/** Why a product variant option value cannot be picked. */
export type ProductVariantOptionUnavailableReason =
	'incompatible' | 'sold_out' | 'temporarily_unavailable';

/** The product variant a value click should land on, plus why the value is unavailable. */
export type ProductVariantOptionResolution<T extends ProductVariantOptions> = {
	productVariant: T | undefined;
	unavailableReason: ProductVariantOptionUnavailableReason | undefined;
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

/** Editable product variant row; mirrors the saveProduct payload plus the SKU lock flag. */
export type ProductVariantFormValue = {
	/** Stored product variant ID; undefined for a new product variant. */
	id: Id<'productVariants'> | undefined;
	options: ProductVariantOption[];
	sku: string;
	/** True when the user chose to edit the SKU manually instead of the automatic one. */
	skuOverridden: boolean;
	/** Assigned library image references; stored keys, or preview IDs for new uploads. */
	imageKeys: string[];
	/** Payable price in cents; undefined while the price input is empty. */
	priceInCents: number | undefined;
	/** Compare-at (regular) price in cents; undefined when there is no discount. */
	compareAtPriceInCents: number | undefined;
	/** Stock count; undefined while the stock input is empty. */
	inventory: number | undefined;
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

export type ProductVariantCaches = {
	priceInCents: number;
	compareAtPriceInCents?: number;
	hasPriceRange: boolean;
};
