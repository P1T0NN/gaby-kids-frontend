// LIBRARIES
import { api } from '@convex/_generated/api';
import { m } from '@/lib/paraglide/messages';

// CONFIG
import {
	DEFAULT_PRODUCT_AGE_GROUP,
	DEFAULT_PRODUCT_GENDER
} from '@/shared/features/products/config.js';
import {
	PRODUCT_AGE_GROUPS,
	PRODUCT_GENDERS
} from '@/shared/features/products/data/productsData.js';
import { PRODUCTS_CONFIG } from '@/shared/features/products/config.js';

// UTILS
import { parseOptionalPriceInCents, priceInCents } from '@/shared/utils/pricing.js';

// TYPES
import type { Snippet } from 'svelte';
import type {
	ProductAgeGroup,
	ProductGender
} from '@/shared/features/products/types/productsTypes.js';
import type { Id } from '@convex/_generated/dataModel';
import type {
	CustomFieldContext,
	FieldConfig,
	MutationValues,
	PreparedMutationArgs
} from '@/components/ui/custom-components/form/formTypes.js';
import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

const AGE_GROUP_LABELS = {
	kids: m['ProductsFeature.ProductAttributes.kids'],
	adults: m['ProductsFeature.ProductAttributes.adults']
} satisfies Record<ProductAgeGroup, () => string>;

const GENDER_LABELS = {
	unisex: m['ProductsFeature.ProductAttributes.unisex'],
	male: m['ProductsFeature.ProductAttributes.male'],
	female: m['ProductsFeature.ProductAttributes.female']
} satisfies Record<ProductGender, () => string>;

const AGE_GROUP_FIELD: FieldConfig = {
	kind: 'select',
	name: 'ageGroup',
	label: m['ProductsFeature.ProductAttributes.ageGroup'](),
	options: PRODUCT_AGE_GROUPS.map((ageGroup) => ({
		value: ageGroup,
		label: AGE_GROUP_LABELS[ageGroup]()
	}))
};

const GENDER_FIELD: FieldConfig = {
	kind: 'select',
	name: 'gender',
	label: m['ProductsFeature.ProductAttributes.gender'](),
	options: PRODUCT_GENDERS.map((gender) => ({
		value: gender,
		label: GENDER_LABELS[gender]()
	}))
};

/**
 * Maps form image references to stored keys. Retained previews already carry a
 * key; pending previews receive one from `uploadedFiles` in submit order.
 */
function buildProductVariantImageKeyMap(
	uploadFiles: readonly PreviewFile[],
	uploadedFiles: readonly string[]
): Map<string, string> {
	const keyByPreviewId = new Map<string, string>();
	let uploadedIndex = 0;

	for (const preview of uploadFiles) {
		if (preview.key) {
			keyByPreviewId.set(preview.id, preview.key);
			continue;
		}
		keyByPreviewId.set(preview.id, uploadedFiles[uploadedIndex] ?? '');
		uploadedIndex += 1;
	}

	return keyByPreviewId;
}

type SaveProductMutation = typeof api.tables.products.mutations.saveProduct.saveProduct;

export function createProductFields(options: {
	productVariantsField: Snippet<[CustomFieldContext]>;
	categoryField: Snippet<[CustomFieldContext]>;
}): FieldConfig[] {
	return [
		{
			kind: 'section',
			class: 'overflow-visible',
			title: m['AddProductPage.basicInfoSectionTitle'](),
			description: m['AddProductPage.basicInfoSectionDescription'](),
			fields: [
				{
					kind: 'input',
					name: 'name',
					label: m['AddProductPage.name'](),
					placeholder: m['AddProductPage.namePlaceholder'](),
					type: 'text',
					maxLength: 255,
					required: true
				},
				{
					kind: 'textarea',
					name: 'description',
					label: m['AddProductPage.description'](),
					placeholder: m['AddProductPage.descriptionPlaceholder'](),
					maxLength: 5_000,
					required: true
				},
				{
					kind: 'upload',
					name: 'images',
					label: m['AddProductPage.images'](),
					description: m['AddProductPage.imagesDescription'](),
					mode: 'multiple'
				},
				{
					kind: 'custom',
					name: 'categoryId',
					label: m['AddProductPage.categories'](),
					description: m['AddProductPage.categoriesDescription'](),
					required: true,
					render: options.categoryField
				},
				...(PRODUCTS_CONFIG.HAS_AGE_GROUP ? [AGE_GROUP_FIELD] : []),
				...(PRODUCTS_CONFIG.HAS_GENDER ? [GENDER_FIELD] : [])
			]
		},
		{
			kind: 'section',
			title: m['ProductVariantsFeature.ProductVariantsEditor.sectionTitle'](),
			description: m['ProductVariantsFeature.ProductVariantsEditor.sectionDescription'](),
			fields: [
				{
					kind: 'switch',
					name: 'trackInventory',
					label: m['AddProductPage.trackInventory'](),
					description: m['AddProductPage.trackInventoryDescription']()
				},
				{
					kind: 'custom',
					name: 'productVariants',
					render: options.productVariantsField
				}
			]
		},
		{
			kind: 'section',
			title: m['AddProductPage.visibilitySectionTitle'](),
			description: m['AddProductPage.visibilitySectionDescription'](),
			fields: [
				{
					kind: 'switch',
					name: 'active',
					label: m['AddProductPage.statusActive'](),
					description: m['AddProductPage.statusDescription']()
				}
			]
		}
	] satisfies FieldConfig[];
}

export function buildSaveProductArgs(options: {
	values: MutationValues<SaveProductMutation>;
	categoryId: string;
	productVariantOptionNames: string[];
	productVariants: ProductVariantFormValue[];
	uploadFiles: PreviewFile[];
	uploadedFiles: string[];
	id?: Id<'products'>;
}): PreparedMutationArgs<SaveProductMutation> {
	const imageKeyByPreviewId = buildProductVariantImageKeyMap(
		options.uploadFiles,
		options.uploadedFiles
	);

	return {
		id: options.id,
		name: String(options.values.name ?? ''),
		description: String(options.values.description ?? ''),
		trackInventory: options.values.trackInventory !== false,
		// SAFETY: the shared schema and Convex validate the selected category ID.
		categoryId: options.categoryId as Id<'categories'>,
		// SAFETY: the shared schema validates the selected age group.
		ageGroup: (options.values.ageGroup as ProductAgeGroup | undefined) ?? DEFAULT_PRODUCT_AGE_GROUP,
		// SAFETY: the shared schema validates the selected gender.
		gender: (options.values.gender as ProductGender | undefined) ?? DEFAULT_PRODUCT_GENDER,
		status: options.values.active ? ('active' as const) : ('draft' as const),
		productVariantOptionNames: options.productVariantOptionNames.map((optionName) =>
			optionName.trim()
		),
		productVariants: options.productVariants.map((productVariant) => {
			const regularPriceInCents = priceInCents(productVariant.price);
			const discountedPriceInCents = parseOptionalPriceInCents(productVariant.discountedPrice);

			return {
				// SAFETY: Convex's v.id('productVariants') validator remains authoritative.
				id: productVariant.id ? (productVariant.id as Id<'productVariants'>) : undefined,
				options: productVariant.options.map((option) => ({
					name: option.name.trim(),
					value: option.value.trim()
				})),
				sku: productVariant.sku.trim(),
				imageKeys: [
					...new Set(
						productVariant.imageKeys.flatMap((imageId) => {
							const key = imageKeyByPreviewId.get(imageId);
							return key ? [key] : [];
						})
					)
				],
				// Stored semantics: the payable price is priceInCents and the regular price is compareAtPriceInCents.
				priceInCents: discountedPriceInCents ?? regularPriceInCents,
				compareAtPriceInCents:
					discountedPriceInCents === undefined ? undefined : regularPriceInCents,
				inventory: Number(productVariant.inventory)
			};
		})
	};
}
