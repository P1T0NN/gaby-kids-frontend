<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// LIBRARIES
	import { useMutation } from 'convex-svelte';
	import type { Doc } from '@convex/_generated/dataModel';

	// COMPONENTS
	import ConfirmDeleteDialog from '@/components/ui/custom-components/confirm-delete-dialog/confirm-delete-dialog.svelte';
	import DestructiveMenuItem from '@/components/ui/custom-components/destructive-menu-item/destructive-menu-item.svelte';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
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

	type Product = Doc<'products'> & {
		categoryOption: { name: string };
		productVariantSummary: { count: number; inventory: number; reservedInventory: number };
	};

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
		from={product.hasPriceRange}
	/>
</TableCell>
<TableCell>
	{#if product.trackInventory ?? true}
		<dl class="grid min-w-32 grid-cols-[auto_auto] gap-x-3 text-xs">
			<dt class="text-muted-foreground">
				{m['AdminProductsPage.AdminProductsTableItem.variants']()}
			</dt>
			<dd class="text-right tabular-nums">{product.productVariantSummary.count}</dd>
			<dt class="text-muted-foreground">
				{m['AdminProductsPage.AdminProductsTableItem.stockOnHand']()}
			</dt>
			<dd class="text-right tabular-nums">{product.productVariantSummary.inventory}</dd>
			<dt class="text-muted-foreground">
				{m['AdminProductsPage.AdminProductsTableItem.reservedStock']()}
			</dt>
			<dd class="text-right tabular-nums">{product.productVariantSummary.reservedInventory}</dd>
			<dt class="font-medium">
				{m['AdminProductsPage.AdminProductsTableItem.availableStock']()}
			</dt>
			<dd class="text-right font-medium tabular-nums">
				{product.productVariantSummary.inventory - product.productVariantSummary.reservedInventory}
			</dd>
		</dl>
	{:else}
		<span class="text-sm text-muted-foreground">
			{m['AdminProductsPage.AdminProductsTableItem.unlimitedStock']()}
		</span>
	{/if}
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
		<ConfirmDeleteDialog
			title={m['AdminProductsPage.AdminProductsTableItem.deleteConfirmationTitle']()}
			description={m['AdminProductsPage.AdminProductsTableItem.deleteConfirmationDescription']({
				name: product.name
			})}
			confirmLabel={m['AdminProductsPage.AdminProductsTableItem.deleteProduct']()}
			cancelLabel={m['AdminProductsPage.AdminProductsTableItem.cancel']()}
			pending={pendingAction !== null}
			onConfirm={(close) => void handleDelete(close)}
		>
			{#snippet trigger({ open })}
				<DestructiveMenuItem
					label={m['AdminProductsPage.AdminProductsTableItem.deleteProduct']()}
					disabled={pendingAction !== null}
					onclick={open}
				/>
			{/snippet}
		</ConfirmDeleteDialog>
	</NativePopover>
</TableCell>
