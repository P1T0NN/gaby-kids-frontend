<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// TRANSLATIONS
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { formatPrice } from '@/shared/features/cart/utils/formatPrice.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel.js';

	let {
		product,
		onRemove
	}: {
		product: Doc<'products'>;
		onRemove: () => void;
	} = $props();
</script>

<div class="flex items-center justify-between gap-4 py-3">
	<div class="flex min-w-0 items-center gap-3">
		{#if product.images[0]}
			<img
				src={product.images[0]}
				alt=""
				width="48"
				height="48"
				class="size-12 shrink-0 rounded-lg object-cover"
			/>
		{:else}
			<div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
				<span class="icon-[lucide--package] size-5 text-muted-foreground" aria-hidden="true"></span>
			</div>
		{/if}
		<div class="min-w-0">
			<p class="truncate text-sm font-medium">{product.name}</p>
			<p class="text-sm text-muted-foreground">{formatPrice(product.priceInCents)}</p>
		</div>
	</div>
	<Button
		type="button"
		variant="destructive"
		size="sm"
		onclick={onRemove}
		aria-label={m['AdminUpsellsPage.AdminUpsellsAddDialogSelectedUpsellItem.removeLabel']({
			name: product.name
		})}
	>
		{m['AdminUpsellsPage.AdminUpsellsAddDialogSelectedUpsellItem.remove']()}
	</Button>
</div>
