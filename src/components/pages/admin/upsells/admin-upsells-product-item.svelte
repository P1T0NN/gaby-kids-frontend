<script lang="ts">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UPSELLS_CONFIG } from '@/shared/features/upsells/config.js';

	// UTILS
	import { formatPrice } from '@/shared/features/cart/utils/formatPrice.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	let { product }: { product: Doc<'products'> | null } = $props();
	const upsellCount = $derived(product?.upsellProductIds?.length ?? 0);
</script>

<div class="flex min-w-0 flex-wrap items-center justify-between gap-3 py-4">
	<div class="flex min-w-0 flex-1 basis-40 items-center gap-3">
		{#if product?.images[0]}
			<img
				src={product.images[0]}
				alt=""
				width="48"
				height="48"
				loading="lazy"
				class="size-12 shrink-0 rounded-lg object-cover"
			/>
		{:else}
			<div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
				<span class="icon-[lucide--package] size-5 text-muted-foreground" aria-hidden="true"></span>
			</div>
		{/if}
		<div class="flex min-w-0 flex-col gap-1">
			<p class="text-sm font-medium break-words">
				{product?.name ?? m['AdminUpsellsPage.AdminUpsellsProductItem.deleted']()}
			</p>
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
				{#if product}<span>{formatPrice(product.priceInCents)}</span>{/if}
				<span>
					{m['AdminUpsellsPage.AdminUpsellsProductItem.upsellCount']({
						count: upsellCount,
						max: UPSELLS_CONFIG.maxProducts
					})}
				</span>
				{#if product && product.status !== 'active'}
					<Badge variant="outline"
						>{product.status === 'draft'
							? m['AdminUpsellsPage.AdminUpsellsProductItem.draft']()
							: m['AdminUpsellsPage.AdminUpsellsProductItem.archived']()}</Badge
					>
				{/if}
			</div>
		</div>
	</div>
</div>
