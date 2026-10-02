// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { internalMutation } from './builders/convexFunctionBuilders.js';

// OPTIONS
import { createProductOptionIndex } from './tables/productOptionIndex/helpers/createProductOptionIndex.js';

// DATA
import {
	PRODUCT_AGE_GROUPS,
	PRODUCT_GENDERS
} from '../shared/features/products/data/productsData.js';
import { PRODUCT_OPTION_FILTERS } from '../shared/features/productVariants/data/productOptionFilters.js';

// UTILS
import { generateSlug } from '../shared/utils/generateSlug.js';
import { getGeneratedProductVariantSku } from '../shared/features/productVariants/utils/getGeneratedProductVariantSku.js';

// TYPES
import type { WithoutSystemFields } from 'convex/server';
import type { Doc, Id } from './_generated/dataModel.js';
import type { MutationCtx } from './_generated/server.js';
import type { ProductVariantDraft } from '../shared/features/productVariants/types/productVariantTypes.js';

const DEFAULT_PRODUCT_COUNT = 25;
const MAX_PRODUCT_COUNT = 60;

const CATEGORY_NAMES = [
	'Guayaberas',
	'Vestidos',
	'Conjuntos',
	'Ropa de bautizo',
	'Primera comunión',
	'Playeras y blusas',
	'Accesorios'
];

const GARMENTS = [
	'Guayabera',
	'Vestido',
	'Conjunto',
	'Ropón',
	'Camisa',
	'Blusa',
	'Pantalón',
	'Short',
	'Falda',
	'Saco',
	'Overol',
	'Chaleco'
];

const GARMENT_DETAILS = [
	'de lino',
	'de manta',
	'bordado a mano',
	'con alforzas',
	'bordado floral',
	'de algodón suave',
	'con encaje',
	'con vivo de color'
];

const AUDIENCES = ['para niño', 'para niña', 'para bebé', 'unisex'];

const DESCRIPTIONS = [
	'Bordado artesanal en manta y lino, con detalles que celebran la tradición mexicana.',
	'Tela natural fresca y suave al tacto, ideal para bautizos, presentaciones y sesiones de fotos.',
	'Acabados hechos a mano y refuerzos pensados para el uso diario.',
	'Corte cómodo con detalles bordados a mano, perfecto para ocasiones especiales.'
];

const PRODUCT_NAMES = GARMENTS.flatMap((garment) =>
	GARMENT_DETAILS.flatMap((detail) =>
		AUDIENCES.map((audience) => `${garment} ${detail} ${audience}`)
	)
);

const COLOR_FILTER = PRODUCT_OPTION_FILTERS[0];
const SIZE_FILTER = PRODUCT_OPTION_FILTERS[1];

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(items: readonly T[]): T {
	return items[randomInt(0, items.length - 1)];
}

function shuffle<T>(items: readonly T[]): T[] {
	return [...items].sort(() => Math.random() - 0.5);
}

function buildProductVariants(options: {
	slug: string;
	priceInCents: number;
}): ProductVariantDraft[] {
	const variants: ProductVariantDraft[] = [];
	const combinations = new Set<string>();
	const variantCount = randomInt(1, 3);

	while (variants.length < variantCount) {
		const color = randomItem(COLOR_FILTER.values);
		const size = randomItem(SIZE_FILTER.values);
		const combination = `${color}|${size}`;
		if (combinations.has(combination)) continue;
		combinations.add(combination);

		const priceInCents = options.priceInCents + randomInt(-3, 3) * 100;
		const variant: ProductVariantDraft = {
			options: [
				{ name: COLOR_FILTER.optionName, value: color },
				{ name: SIZE_FILTER.optionName, value: size }
			],
			sku: getGeneratedProductVariantSku({
				slug: options.slug,
				optionValues: [color, size],
				position: variants.length
			}),
			imageKeys: [],
			priceInCents,
			inventory: randomInt(0, 20)
		};
		if (Math.random() < 0.35) {
			variant.compareAtPriceInCents = Math.ceil((priceInCents * 1.25) / 100) * 100;
		}

		variants.push(variant);
	}

	return variants;
}

async function clearCatalog(ctx: MutationCtx): Promise<void> {
	for await (const product of ctx.db.query('products')) {
		for await (const variant of ctx.db
			.query('productVariants')
			.withIndex('by_product_id', (query) => query.eq('productId', product._id))) {
			await ctx.db.delete(variant._id);
		}
		for await (const optionRow of ctx.db
			.query('productOptionIndex')
			.withIndex('by_product_id', (query) => query.eq('productId', product._id))) {
			await ctx.db.delete(optionRow._id);
		}
		await ctx.db.delete(product._id);
	}

	for await (const category of ctx.db.query('categories')) {
		await ctx.db.delete(category._id);
	}
}

async function insertCategories(ctx: MutationCtx): Promise<Id<'categories'>[]> {
	const categoryIds: Id<'categories'>[] = [];

	for (const name of CATEGORY_NAMES) {
		categoryIds.push(
			await ctx.db.insert('categories', {
				name,
				slug: generateSlug(name),
				status: 'active'
			})
		);
	}

	return categoryIds;
}

async function insertProduct(
	ctx: MutationCtx,
	categoryId: Id<'categories'>,
	name: string
): Promise<number> {
	const slug = generateSlug(name);
	const variants = buildProductVariants({ slug, priceInCents: randomInt(249, 899) * 100 });
	const prices = variants.map((variant) => variant.priceInCents);
	const sharedCompareAtPriceInCents = variants[0].compareAtPriceInCents;
	const hasSharedCompareAtPrice =
		sharedCompareAtPriceInCents !== undefined &&
		variants.every((variant) => variant.compareAtPriceInCents === sharedCompareAtPriceInCents);

	const product: WithoutSystemFields<Doc<'products'>> = {
		name,
		slug,
		description: randomItem(DESCRIPTIONS),
		productVariantOptionNames: [COLOR_FILTER.optionName, SIZE_FILTER.optionName],
		priceInCents: Math.min(...prices),
		hasPriceRange: Math.min(...prices) !== Math.max(...prices),
		categoryIds: [categoryId],
		ageGroup: randomItem(PRODUCT_AGE_GROUPS),
		gender: randomItem(PRODUCT_GENDERS),
		imageKeys: [],
		storagePrefix: 'products',
		trackInventory: true,
		upsellProductIds: [],
		status: 'active'
	};
	if (hasSharedCompareAtPrice) product.compareAtPriceInCents = sharedCompareAtPriceInCents;

	const productId = await ctx.db.insert('products', product);

	for (const [position, variant] of variants.entries()) {
		const fields: WithoutSystemFields<Doc<'productVariants'>> = {
			productId,
			position,
			options: variant.options,
			sku: variant.sku,
			imageKeys: variant.imageKeys,
			priceInCents: variant.priceInCents,
			inventory: variant.inventory,
			reservedInventory: 0
		};
		if (variant.compareAtPriceInCents !== undefined) {
			fields.compareAtPriceInCents = variant.compareAtPriceInCents;
		}
		await ctx.db.insert('productVariants', fields);
	}

	await createProductOptionIndex({
		ctx,
		product: (await ctx.db.get(productId))!,
		variants
	});

	return variants.length;
}

/**
 * Dev-only catalog seeder: wipes products, product variants, option-index rows and
 * categories, then inserts a randomized catalog. Re-runnable.
 *
 * `bunx convex run seed:seedDevData --push` (optionally with `{"count": 30}`)
 */
export const seedDevData = internalMutation({
	args: { count: v.optional(v.number()) },
	returns: v.object({
		categories: v.number(),
		products: v.number(),
		productVariants: v.number()
	}),
	handler: async (ctx, args) => {
		const count = Math.min(
			Math.max(Math.trunc(args.count ?? DEFAULT_PRODUCT_COUNT), 1),
			MAX_PRODUCT_COUNT
		);

		await clearCatalog(ctx);
		const categoryIds = await insertCategories(ctx);

		let productVariants = 0;
		for (const name of shuffle(PRODUCT_NAMES).slice(0, count)) {
			productVariants += await insertProduct(ctx, randomItem(categoryIds), name);
		}

		return { categories: categoryIds.length, products: count, productVariants };
	}
});
