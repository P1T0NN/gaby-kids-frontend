<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// LIBRARIES
	import { useMutation } from 'convex-svelte';
	import type { Doc } from '@convex/_generated/dataModel';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import { TableCell } from '@/components/ui/table/index.js';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import ProductPrice from '@/features/products/components/product-price.svelte';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// CONSTANTS
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';
	import { toastMessage } from '@/utils/toastMessage.js';

	type Product = Doc<'products'> & { categoryOption: { name: string } };

	let { product }: { product: Product } = $props();

	let pendingAction = $state<'delete' | null>(null);

	const deleteProduct = useMutation(api.tables.products.mutations.deleteProduct.deleteProduct);

	async function handleDelete(close: () => void): Promise<void> {
		if (pendingAction !== null) return;

		pendingAction = 'delete';
		try {
			await deleteProduct({ id: product._id });
			toastMessage({
				type: 'success',
				message: m['AdminProductsPage.AdminProductsTableItem.productDeleted']()
			});
			close();
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: m['AdminProductsPage.AdminProductsTableItem.deleteError']()
			});
		} finally {
			pendingAction = null;
		}
	}
</script>

{#snippet actionsTrigger()}
	<span class="icon-[lucide--ellipsis] size-4" aria-hidden="true"></span>
{/snippet}

<TableCell>
	<div class="flex min-w-0 items-center gap-3">
		{#if product.images[0]}
			<img
				src={product.images[0]}
				alt=""
				width="40"
				height="40"
				loading="lazy"
				class="size-10 shrink-0 rounded-lg object-cover"
			/>
		{:else}
			<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
				<span class="icon-[lucide--package] size-5" aria-hidden="true"></span>
			</div>
		{/if}
		<div class="min-w-0">
			<p class="truncate font-medium">{product.name}</p>
			<p class="max-w-lg truncate text-xs text-muted-foreground">{product.description}</p>
		</div>
	</div>
</TableCell>
<TableCell class="whitespace-nowrap">
	<ProductPrice
		priceInCents={product.priceInCents}
		compareAtPriceInCents={product.compareAtPriceInCents}
	/>
</TableCell>
<TableCell class="max-w-48 truncate">{product.categoryOption.name}</TableCell>
<TableCell class="hidden whitespace-nowrap text-muted-foreground md:table-cell">
	{formatDate(product._creationTime, getLocale())}
</TableCell>
<TableCell class="text-right">
	<NativePopover
		id={`product-actions-${product._id}`}
		trigger={actionsTrigger}
		triggerLabel={m['AdminProductsPage.AdminProductsTableItem.openProductActions']({
			name: product.name
		})}
		triggerClass="size-8 justify-center hover:bg-muted [&_svg]:size-4"
		class="min-w-44"
	>
		<Link
			href={ADMIN_PAGE_ENDPOINTS.EDIT_PRODUCT(product._id)}
			class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
		>
			<span class="icon-[lucide--pencil] size-4" aria-hidden="true"></span>
			{m['AdminProductsPage.AdminProductsTableItem.editProduct']()}
		</Link>
		<NativeDialog>
			{#snippet trigger({ open })}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					class="w-full justify-start rounded-xl px-3 py-2 font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
					onclick={open}
					disabled={pendingAction !== null}
				>
					<span class="icon-[lucide--trash-2] size-4" aria-hidden="true"></span>
					{m['AdminProductsPage.AdminProductsTableItem.deleteProduct']()}
				</Button>
			{/snippet}

			{#snippet children({ close })}
				<div class="flex flex-col gap-5 p-6">
					<div class="flex flex-col gap-1.5">
						<h2 class="text-lg font-semibold">
							{m['AdminProductsPage.AdminProductsTableItem.deleteConfirmationTitle']()}
						</h2>
						<p class="text-sm text-muted-foreground">
							{m['AdminProductsPage.AdminProductsTableItem.deleteConfirmationDescription']({
								name: product.name
							})}
						</p>
					</div>

					<div class="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={close}
							disabled={pendingAction !== null}
						>
							{m['AdminProductsPage.AdminProductsTableItem.cancel']()}
						</Button>
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onclick={() => void handleDelete(close)}
							disabled={pendingAction !== null}
						>
							{#if pendingAction === 'delete'}<Spinner data-icon="inline-start" />{/if}
							{m['AdminProductsPage.AdminProductsTableItem.deleteProduct']()}
						</Button>
					</div>
				</div>
			{/snippet}
		</NativeDialog>
	</NativePopover>
</TableCell>
