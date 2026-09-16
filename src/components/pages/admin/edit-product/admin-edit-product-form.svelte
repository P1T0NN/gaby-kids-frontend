<script lang="ts">
	// SVELTEKIT IMPORTS
	import { gotoParaglide } from '@/utils/gotoParaglide.js';
	import { untrack } from 'svelte';

	// LIBRARIES
	import { api } from '@convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { parseOptionalPriceInCents, priceInCents } from '@/shared/utils/pricing.js';

	// COMPONENTS
	import ProductCategorySelector from '@/features/categories/components/product-category-selector.svelte';
	import ProductDiscountCalculator from '@/features/products/components/product-discount-calculator.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useFormChanges } from '@/hooks/useFormChanges.svelte.js';

	// SCHEMAS
	import { saveProductSchema } from '@/shared/features/products/schemas/productsSchemas.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type {
		CustomFieldContext,
		FieldConfig
	} from '@/components/ui/custom-components/form/formTypes.js';
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { FunctionReturnType } from 'convex/server';
	import type { Id } from '@convex/_generated/dataModel';

	type Product = FunctionReturnType<
		typeof api.tables.products.queries.fetchProductById.fetchProductById
	>;

	let { product }: { product: Product } = $props();
	const initialProduct = untrack(() => product);
	const regularPriceInCents = initialProduct.compareAtPriceInCents ?? initialProduct.priceInCents;
	const discountedPriceInCents =
		initialProduct.compareAtPriceInCents === undefined ? undefined : initialProduct.priceInCents;
	let submitting = $state(false);
	let categoryId = $state<string>(initialProduct.categoryId);
	const formChanges = useFormChanges(() => ({
		id: initialProduct._id,
		name: initialProduct.name,
		description: initialProduct.description,
		priceInCents: regularPriceInCents / 100,
		compareAtPriceInCents:
			discountedPriceInCents === undefined ? undefined : discountedPriceInCents / 100,
		active: initialProduct.status === 'active'
	}));

	let uploadFiles = $state<PreviewFile[]>(
		initialProduct.imageKeys.map((key, index) => ({
			id: key,
			key,
			url: initialProduct.images[index] ?? ''
		}))
	);

	function createProductFields(
		discountField: Snippet<[CustomFieldContext]>,
		categoryField: Snippet<[CustomFieldContext]>
	): FieldConfig[] {
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
						kind: 'custom',
						name: 'discountCalculator',
						label: m['AddProductPage.discountPresets'](),
						class: '-mt-3',
						render: discountField
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
						render: categoryField
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
</script>

{#snippet categoryField({ field, disabled }: CustomFieldContext)}
	<ProductCategorySelector
		id={field.name}
		bind:selectedId={categoryId}
		initialCategory={initialProduct.categoryOption}
		required
		{disabled}
	/>
{/snippet}

{#snippet discountField({ disabled, getValue, setValue }: CustomFieldContext)}
	<ProductDiscountCalculator {disabled} {getValue} {setValue} />
{/snippet}

<Form
	function={api.tables.products.mutations.saveProduct.saveProduct}
	fields={createProductFields(discountField, categoryField)}
	schema={saveProductSchema}
	uploadNamespace="products"
	bind:values={formChanges.values}
	bind:uploadFiles
	bind:submitting
	resetOnSuccess={false}
	prepareArgs={({ values }) => {
		const regularPriceInCents = priceInCents(values.priceInCents);
		const discountedPriceInCents = parseOptionalPriceInCents(values.compareAtPriceInCents);

		return {
			id: initialProduct._id,
			name: String(values.name ?? ''),
			description: String(values.description ?? ''),
			// The stored fields keep their existing compatibility semantics: the payable price
			// is stored as priceInCents and the regular price as compareAtPriceInCents.
			priceInCents: discountedPriceInCents ?? regularPriceInCents,
			compareAtPriceInCents: discountedPriceInCents === undefined ? undefined : regularPriceInCents,
			categoryId: categoryId as Id<'categories'>,
			status: values.active ? ('active' as const) : ('draft' as const)
		};
	}}
	onSuccess={() => gotoParaglide(ADMIN_PAGE_ENDPOINTS.PRODUCTS)}
	successMessage={m['AdminEditProductPage.productUpdated']()}
	errorMessage={m['AdminEditProductPage.updateError']()}
>
	<div class="flex flex-wrap justify-end gap-2">
		<ButtonLink href={ADMIN_PAGE_ENDPOINTS.PRODUCTS} variant="outline">
			{m['AdminEditProductPage.cancel']()}
		</ButtonLink>
		<Button type="submit" disabled={submitting}>
			{#if submitting}
				<Spinner />
			{/if}
			{m['AdminEditProductPage.saveChanges']()}
		</Button>
	</div>
</Form>
