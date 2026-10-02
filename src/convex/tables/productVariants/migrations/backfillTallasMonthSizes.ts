// HELPERS
import { createProductOptionIndex } from '../../productOptionIndex/helpers/createProductOptionIndex.js';
import { isProductVariantSkuTaken } from '../helpers/isProductVariantSkuTaken.js';

// MIGRATIONS
import { migrations } from '../../../migrations/migrations.js';

// UTILS
import { normalizeProductOptionText } from '../../../../shared/features/productVariants/utils/normalizeProductOptionText.js';

// TYPES
import type { WithoutSystemFields } from 'convex/server';
import type { Doc, Id } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';
import type { ProductVariantOption } from '../../../../shared/features/productVariants/types/productVariantTypes.js';

const TALLAS_OPTION_NAME = 'Tallas';
const LEGACY_SIZE_OPTION_NAMES = new Set(['size', 'talla']);
const MONTH_SIZE_BY_LEGACY_VALUE = new Map([
	['00', '3M'],
	['0', '6M']
]);
const COMBINED_MONTH_SIZE_VALUE = '3-6m';

function isSizeOptionName(optionName: string): boolean {
	const normalizedName = normalizeProductOptionText(optionName);
	return (
		normalizedName === normalizeProductOptionText(TALLAS_OPTION_NAME) ||
		LEGACY_SIZE_OPTION_NAMES.has(normalizedName)
	);
}

/** Renames the Size option to Tallas and rewrites its 0/00 values to 6M/3M. */
function toTallasOption(option: ProductVariantOption): ProductVariantOption {
	if (!isSizeOptionName(option.name)) return option;

	return {
		name: TALLAS_OPTION_NAME,
		value: MONTH_SIZE_BY_LEGACY_VALUE.get(normalizeProductOptionText(option.value)) ?? option.value
	};
}

function hasOptionChanged(
	option: ProductVariantOption,
	previousOption: ProductVariantOption
): boolean {
	return option.name !== previousOption.name || option.value !== previousOption.value;
}

/** Replaces the combined `3-6M` SKU token with one month label, or appends it. */
function toMonthSizeSku(sku: string, monthSize: string): string {
	const token = '3-6M';
	const tokenIndex = sku.toUpperCase().lastIndexOf(token);
	if (tokenIndex === -1) return `${sku}-${monthSize}`;

	return `${sku.slice(0, tokenIndex)}${monthSize}${sku.slice(tokenIndex + token.length)}`;
}

async function getAvailableSku(
	ctx: MutationCtx,
	baseSku: string,
	productVariantId: Id<'productVariants'> | undefined
): Promise<string> {
	let candidate = baseSku;
	let suffix = 2;
	while (await isProductVariantSkuTaken(ctx, candidate, productVariantId)) {
		candidate = `${baseSku}-${suffix}`;
		suffix += 1;
	}

	return candidate;
}

/**
 * Splits a `3-6M` variant into individual `3M` and `6M` variants: the original
 * keeps its stock and images as `3M`, and a new out-of-stock `6M` variant is
 * created beside it with the same position, price, and images.
 */
async function splitCombinedMonthSize(
	ctx: MutationCtx,
	productVariant: Doc<'productVariants'>,
	sizeOptionIndex: number
): Promise<void> {
	const threeMonthOptions = productVariant.options.map(toTallasOption);
	threeMonthOptions[sizeOptionIndex] = { name: TALLAS_OPTION_NAME, value: '3M' };
	await ctx.db.patch(productVariant._id, {
		options: threeMonthOptions,
		sku: await getAvailableSku(ctx, toMonthSizeSku(productVariant.sku, '3M'), productVariant._id)
	});

	const sixMonthOptions = productVariant.options.map(toTallasOption);
	sixMonthOptions[sizeOptionIndex] = { name: TALLAS_OPTION_NAME, value: '6M' };
	const sixMonthVariant: WithoutSystemFields<Doc<'productVariants'>> = {
		productId: productVariant.productId,
		position: productVariant.position,
		options: sixMonthOptions,
		sku: await getAvailableSku(ctx, toMonthSizeSku(productVariant.sku, '6M'), undefined),
		imageKeys: productVariant.imageKeys,
		priceInCents: productVariant.priceInCents,
		inventory: 0,
		reservedInventory: 0
	};
	if (productVariant.compareAtPriceInCents !== undefined) {
		sixMonthVariant.compareAtPriceInCents = productVariant.compareAtPriceInCents;
	}

	await ctx.db.insert('productVariants', sixMonthVariant);
}

async function renameProductSizeOption(ctx: MutationCtx, product: Doc<'products'>): Promise<void> {
	const updatedOptionNames = product.productVariantOptionNames.map((optionName) =>
		isSizeOptionName(optionName) ? TALLAS_OPTION_NAME : optionName
	);
	const optionNamesChanged = updatedOptionNames.some(
		(optionName, index) => optionName !== product.productVariantOptionNames[index]
	);
	if (!optionNamesChanged) return;

	await ctx.db.patch(product._id, { productVariantOptionNames: updatedOptionNames });
}

async function rebuildProductOptionIndex(
	ctx: MutationCtx,
	product: Doc<'products'>
): Promise<void> {
	const variants: Doc<'productVariants'>[] = [];
	for await (const variant of ctx.db
		.query('productVariants')
		.withIndex('by_product_id', (query) => query.eq('productId', product._id))) {
		variants.push(variant);
	}

	await createProductOptionIndex({ ctx, product, variants });
}

/**
 * Rewrites the legacy Size option name to Tallas and its `0`/`00` values to
 * `6M`/`3M`, splits combined `3-6M` variants into separate `3M` and `6M`
 * variants, and rebuilds the shop filter index. Idempotent: already-migrated
 * options produce no writes on a rerun.
 */
export const backfillTallasMonthSizes = migrations.define({
	table: 'productVariants',
	migrateOne: async (ctx, productVariant) => {
		const product = await ctx.db.get(productVariant.productId);
		if (!product) return;

		const combinedSizeOptionIndex = productVariant.options.findIndex(
			(option) =>
				isSizeOptionName(option.name) &&
				normalizeProductOptionText(option.value) === COMBINED_MONTH_SIZE_VALUE
		);

		if (combinedSizeOptionIndex >= 0) {
			await splitCombinedMonthSize(ctx, productVariant, combinedSizeOptionIndex);
		} else {
			const updatedOptions = productVariant.options.map(toTallasOption);
			const changed = updatedOptions.some((option, index) =>
				hasOptionChanged(option, productVariant.options[index])
			);
			if (!changed) return;

			await ctx.db.patch(productVariant._id, { options: updatedOptions });
		}

		await renameProductSizeOption(ctx, product);
		await rebuildProductOptionIndex(ctx, product);
	}
});
