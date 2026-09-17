// LIBRARIES
import { api } from '@convex/_generated/api';
import { m } from '@/lib/paraglide/messages';

// UTILS
import { parseOptionalPriceInCents, priceInCents } from '@/shared/utils/pricing.js';

// TYPES
import type { Snippet } from 'svelte';
import type { Id } from '@convex/_generated/dataModel';
import type {
	CustomFieldContext,
	FieldConfig,
	MutationValues,
	PreparedMutationArgs
} from '@/components/ui/custom-components/form/formTypes.js';

type SaveProductMutation = typeof api.tables.products.mutations.saveProduct.saveProduct;

export function createProductFields(options: {
	discountField: Snippet<[CustomFieldContext]>;
	categoryField: Snippet<[CustomFieldContext]>;
	inventoryMin: number;
	inventoryDisabled: boolean;
}): FieldConfig[] {
	return [
		{
			kind: 'section',
			class: 'overflow-visible',
			title: m['AddProductPage.detailsTitle'](),
			description: m['AddProductPage.detailsDescription'](),
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
					kind: 'input',
					name: 'priceInCents',
					label: m['AddProductPage.price'](),
					placeholder: m['AddProductPage.pricePlaceholder'](),
					description: m['AddProductPage.priceDescription'](),
					type: 'number',
					min: 0.01,
					step: 0.01,
					required: true
				},
				{
					kind: 'input',
					name: 'compareAtPriceInCents',
					label: m['AddProductPage.discountedPrice'](),
					description: m['AddProductPage.discountedPriceDescription'](),
					placeholder: m['AddProductPage.discountedPricePlaceholder'](),
					type: 'number',
					min: 0.01,
					step: 0.01
				},
				{
					kind: 'switch',
					name: 'trackInventory',
					label: m['AddProductPage.trackInventory'](),
					description: m['AddProductPage.trackInventoryDescription']()
				},
				{
					kind: 'input',
					name: 'inventory',
					label: m['AddProductPage.inventory'](),
					description: m['AddProductPage.inventoryDescription'](),
					type: 'number',
					min: options.inventoryMin,
					max: Number.MAX_SAFE_INTEGER,
					step: 1,
					required: true,
					disabled: options.inventoryDisabled
				},
				{
					kind: 'custom',
					name: 'discountCalculator',
					label: m['AddProductPage.discountPresets'](),
					class: '-mt-3',
					render: options.discountField
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
	id?: Id<'products'>;
}): PreparedMutationArgs<SaveProductMutation> {
	const regularPriceInCents = priceInCents(options.values.priceInCents);
	const discountedPriceInCents = parseOptionalPriceInCents(options.values.compareAtPriceInCents);

	return {
		id: options.id,
		name: String(options.values.name ?? ''),
		description: String(options.values.description ?? ''),
		// The stored fields keep their existing compatibility semantics: the payable price
		// is stored as priceInCents and the regular price as compareAtPriceInCents.
		priceInCents: discountedPriceInCents ?? regularPriceInCents,
		compareAtPriceInCents: discountedPriceInCents === undefined ? undefined : regularPriceInCents,
		trackInventory: options.values.trackInventory !== false,
		inventory: Number(options.values.inventory),
		// SAFETY: the shared schema and Convex validate the selected category ID.
		categoryId: options.categoryId as Id<'categories'>,
		status: options.values.active ? ('active' as const) : ('draft' as const)
	};
}
