<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import UpsellProductSummary from '../upsell-product-summary.svelte';

	// TRANSLATIONS
	import { m } from '@/lib/paraglide/messages';

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
		<UpsellProductSummary {product} thumbnailSize={48} />
	</div>
	<Button
		type="button"
		variant="destructive"
		size="sm"
		onclick={onRemove}
		aria-label={m['UpsellsFeature.ManageUpsellsDialogSelectedUpsellItem.removeLabel']({
			name: product.name
		})}
	>
		{m['UpsellsFeature.ManageUpsellsDialogSelectedUpsellItem.remove']()}
	</Button>
</div>
