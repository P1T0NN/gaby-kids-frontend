<script lang="ts">
	// COMPONENTS
	import Footer from '@/components/ui/custom-components/footer/footer.svelte';
	import Header from '@/components/ui/custom-components/header/header.svelte';
	import UpsellsDialog from '@/features/upsells/components/upsells-dialog/upsells-dialog.svelte';

	// CONTEXT
	import { setOpenUpsells } from '@/features/upsells/components/upsells-dialog/upsells-dialog-context.js';

	let { children } = $props();

	let upsellsDialog: UpsellsDialog;
	setOpenUpsells((product, openCartIfEmpty) => upsellsDialog.open(product, openCartIfEmpty));
</script>

<div class="flex min-h-dvh flex-col">
	<Header />
	<div class="flex-1">
		{@render children()}
	</div>
	<Footer />
</div>
<UpsellsDialog bind:this={upsellsDialog} />
