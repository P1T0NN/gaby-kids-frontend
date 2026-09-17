<script lang="ts">
	// SVELTEKIT IMPORTS
	import { gotoParaglide } from '@/utils/gotoParaglide.js';
	import { untrack } from 'svelte';

	// LIBRARIES
	import { api } from '@convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import {
		buildSaveProductArgs,
		createProductFields
	} from '@/features/products/forms/createProductForm.js';

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
	import type { CustomFieldContext } from '@/components/ui/custom-components/form/formTypes.js';
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { FunctionReturnType } from 'convex/server';

	type Product = FunctionReturnType<
		typeof api.tables.products.queries.fetchProductById.fetchProductById
	>;

	let { product }: { product: Product } = $props();

	const initialProduct = untrack(() => product);

	const regularPriceInCents = initialProduct.compareAtPriceInCents ?? initialProduct.priceInCents;

	const discountedPriceInCents = initialProduct.compareAtPriceInCents === undefined ? undefined : initialProduct.priceInCents;

	let submitting = $state(false);
	let categoryId = $state<string>(initialProduct.categoryId);

	const formChanges = useFormChanges(() => ({
		id: initialProduct._id,
		name: initialProduct.name,
		description: initialProduct.description,
		priceInCents: regularPriceInCents / 100,
		compareAtPriceInCents: discountedPriceInCents === undefined ? undefined : discountedPriceInCents / 100,
		trackInventory: initialProduct.trackInventory,
		inventory: initialProduct.inventory,
		active: initialProduct.status === 'active'
	}));

	let uploadFiles = $state<PreviewFile[]>(
		initialProduct.imageKeys.map((key, index) => ({
			id: key,
			key,
			url: initialProduct.images[index] ?? ''
		}))
	);
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
	fields={createProductFields({
		discountField,
		categoryField,
		inventoryMin: initialProduct.reservedInventory,
		inventoryDisabled: formChanges.values.trackInventory === false
	})}
	schema={saveProductSchema}
	uploadNamespace="products"
	bind:values={formChanges.values}
	bind:uploadFiles
	bind:submitting
	resetOnSuccess={false}
	prepareArgs={({ values }) => buildSaveProductArgs({ values, categoryId, id: initialProduct._id })}
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
