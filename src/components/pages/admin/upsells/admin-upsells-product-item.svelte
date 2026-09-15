<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import DeleteUpsellsDialog from '@/features/upsells/components/manage-upsells-dialog/delete-upsells-dialog.svelte';
	import ManageUpsellsDialog from '@/features/upsells/components/manage-upsells-dialog/manage-upsells-dialog.svelte';
	import { Badge } from '@/components/ui/badge/index.js';

	/// UTILS
	import { formatPrice } from '@/shared/utils/pricing.js';

	// TYPES
	import type { Doc, Id } from '@convex/_generated/dataModel';

	let {
		product,
		upsells
	}: {
		product: Doc<'products'>;
		upsells: { productId: Id<'products'>; product: Doc<'products'> | null }[];
	} = $props();
</script>

<article class="overflow-hidden rounded-xl border bg-card text-card-foreground">
	<div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex min-w-0 items-center gap-4">
			{#if product.images[0]}
				<img
					src={product.images[0]}
					alt=""
					width="64"
					height="64"
					loading="lazy"
					class="size-16 shrink-0 rounded-xl object-cover"
				/>
			{:else}
				<div class="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted">
					<span class="icon-[lucide--package] size-6 text-muted-foreground" aria-hidden="true"
					></span>
				</div>
			{/if}
			<div class="flex min-w-0 flex-col gap-1.5">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					{m['AdminUpsellsPage.AdminUpsellsProductItem.mainProduct']()}
				</p>
				<div class="flex flex-wrap items-center gap-2">
					<h2 class="text-base font-semibold wrap-break-word">{product.name}</h2>
					{#if product.status !== 'active'}
						<Badge variant="outline"
							>{product.status === 'draft'
								? m['AdminUpsellsPage.AdminUpsellsProductItem.draft']()
								: m['AdminUpsellsPage.AdminUpsellsProductItem.archived']()}</Badge
						>
					{/if}
				</div>
				<p class="text-sm text-muted-foreground">{formatPrice(product.priceInCents)}</p>
			</div>
		</div>
		<div class="flex flex-wrap gap-2">
			<ManageUpsellsDialog upsellId={product._id} />
			<DeleteUpsellsDialog productId={product._id} productName={product.name} />
		</div>
	</div>

	<div class="border-t bg-muted/30 p-5">
		<div class="mb-3 flex items-center gap-2 text-sm font-medium">
			<span class="icon-[lucide--corner-right-down] size-4 text-muted-foreground" aria-hidden="true"
			></span>
			{m['AdminUpsellsPage.AdminUpsellsProductItem.upsellProducts']()}
		</div>

		<ul class="grid gap-2 sm:grid-cols-2">
			{#each upsells as upsell (upsell.productId)}
				<li class="flex min-w-0 items-center gap-3 rounded-lg bg-background p-2.5 shadow-xs">
					{#if upsell.product?.images[0]}
						<img
							src={upsell.product.images[0]}
							alt=""
							width="40"
							height="40"
							loading="lazy"
							class="size-10 shrink-0 rounded-md object-cover"
						/>
					{:else}
						<div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
							<span class="icon-[lucide--package] size-4 text-muted-foreground" aria-hidden="true"
							></span>
						</div>
					{/if}
					<div class="flex min-w-0 flex-1 items-center justify-between gap-2">
						<div class="min-w-0">
							<p class="truncate text-sm font-medium">
								{upsell.product?.name ?? m['AdminUpsellsPage.AdminUpsellsProductItem.deleted']()}
							</p>
							{#if upsell.product}
								<p class="text-xs text-muted-foreground">
									{formatPrice(upsell.product.priceInCents)}
								</p>
							{/if}
						</div>
						{#if upsell.product && upsell.product.status !== 'active'}
							<Badge variant="outline"
								>{upsell.product.status === 'draft'
									? m['AdminUpsellsPage.AdminUpsellsProductItem.draft']()
									: m['AdminUpsellsPage.AdminUpsellsProductItem.archived']()}</Badge
							>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</div>
</article>
