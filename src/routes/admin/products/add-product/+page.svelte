<script lang="ts">
	// SVELTEKIT IMPORTS
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import { saveProductSchema } from '@/shared/features/products/schemas/productsSchemas.js';

	// COMPONENTS
	import AdminAddProductHeader from '@/components/pages/admin/add-product/admin-add-product-header.svelte';
	import ProductCategorySelector from '@/features/categories/components/product-category-selector.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type {
		CustomFieldContext,
		FieldConfig,
		MutationValues
	} from '@/components/ui/custom-components/form/formTypes.js';
	import type { Id } from '@convex/_generated/dataModel';

	let submitting = $state(false);
	let categoryId = $state('');
	
	let values = $state<MutationValues<typeof api.tables.products.mutations.saveProduct.saveProduct>>({
		active: true
	});

	function createProductFields(categoryField: Snippet<[CustomFieldContext]>): FieldConfig[] {
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
						type: 'number',
						min: 0.01,
						step: 0.01,
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

<SvelteHead title={m['AddProductPage.pageTitle']()} noindex />

{#snippet categoryField({ field, disabled }: CustomFieldContext)}
	<ProductCategorySelector id={field.name} bind:selectedId={categoryId} required {disabled} />
{/snippet}

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6">
	<AdminAddProductHeader />

	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<Form
		function={api.tables.products.mutations.saveProduct.saveProduct}
		fields={createProductFields(categoryField)}
		bind:values
		schema={saveProductSchema}
		uploadNamespace="products"
		prepareArgs={({ values }) => ({
			name: String(values.name ?? ''),
			description: String(values.description ?? ''),
			priceInCents: Math.round(Number(values.priceInCents) * 100),
			// SAFETY: the shared schema and Convex validate the selected category ID.
			categoryId: categoryId as Id<'categories'>,
			status: values.active ? ('active' as const) : ('draft' as const)
		})}
		bind:submitting
		onSuccess={() => goto(ADMIN_PAGE_ENDPOINTS.PRODUCTS)}
		successMessage={m['AddProductPage.productAdded']()}
		errorMessage={m['AddProductPage.addError']()}
	>
		<div class="flex flex-wrap items-center justify-end gap-2">
			<p class="mr-auto text-sm text-muted-foreground">
				{values.active ? m['AddProductPage.activeHint']() : m['AddProductPage.draftHint']()}
			</p>
			<Button href={ADMIN_PAGE_ENDPOINTS.PRODUCTS} variant="outline">
				{m['AddProductPage.cancel']()}
			</Button>
			<Button type="submit" disabled={submitting}>
				{#if submitting}
					<Spinner />
				{/if}
				{m['AddProductPage.addProduct']()}
			</Button>
		</div>
	</Form>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</div>
