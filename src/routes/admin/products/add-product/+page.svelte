<script lang="ts">
	// SVELTEKIT IMPORTS
	import { gotoParaglide } from '@/utils/gotoParaglide.js';

	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import { saveProductSchema } from '@/shared/features/products/schemas/productsSchemas.js';

	// UTILS
	import {
		buildSaveProductArgs,
		createProductFields
	} from '@/features/products/forms/createProductForm.js';

	// COMPONENTS
	import AdminAddProductHeader from '@/components/pages/admin/add-product/admin-add-product-header.svelte';
	import ProductCategorySelector from '@/features/categories/components/product-category-selector.svelte';
	import ProductDiscountCalculator from '@/features/products/components/product-discount-calculator.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// TYPES
	import type {
		CustomFieldContext,
		MutationValues
	} from '@/components/ui/custom-components/form/formTypes.js';

	let submitting = $state(false);
	let categoryId = $state('');

	let values = $state<MutationValues<typeof api.tables.products.mutations.saveProduct.saveProduct>>(
		{
			active: true,
			trackInventory: true,
			inventory: 0
		}
	);
</script>

<SvelteHead title={m['AddProductPage.pageTitle']()} noindex />

{#snippet categoryField({ field, disabled }: CustomFieldContext)}
	<ProductCategorySelector id={field.name} bind:selectedId={categoryId} required {disabled} />
{/snippet}

{#snippet discountField({ disabled, getValue, setValue }: CustomFieldContext)}
	<ProductDiscountCalculator {disabled} {getValue} {setValue} />
{/snippet}

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6">
	<AdminAddProductHeader />

	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<Form
		function={api.tables.products.mutations.saveProduct.saveProduct}
		fields={createProductFields({
			discountField,
			categoryField,
			inventoryMin: 0,
			inventoryDisabled: values.trackInventory === false
		})}
		bind:values
		schema={saveProductSchema}
		uploadNamespace="products"
		prepareArgs={({ values }) => buildSaveProductArgs({ values, categoryId })}
		bind:submitting
		onSuccess={() => gotoParaglide(ADMIN_PAGE_ENDPOINTS.PRODUCTS)}
		successMessage={m['AddProductPage.productAdded']()}
		errorMessage={m['AddProductPage.addError']()}
	>
		<div class="flex flex-wrap items-center justify-end gap-2">
			<p class="mr-auto text-sm text-muted-foreground">
				{values.active ? m['AddProductPage.activeHint']() : m['AddProductPage.draftHint']()}
			</p>
			<ButtonLink href={ADMIN_PAGE_ENDPOINTS.PRODUCTS} variant="outline">
				{m['AddProductPage.cancel']()}
			</ButtonLink>
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
