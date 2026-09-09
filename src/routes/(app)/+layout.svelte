<script lang="ts">
	// COMPONENTS
	import Header from '@/components/ui/custom-components/header/header.svelte';
	import UpsellsDialog from '@/features/upsells/components/upsells-dialog/upsells-dialog.svelte';

	// CONTEXT
	import { setOpenUpsells } from '@/features/upsells/components/upsells-dialog/upsells-dialog-context.js';

	let { children } = $props();
	
	let upsellsDialog: UpsellsDialog;
	setOpenUpsells((product, openCartIfEmpty) => upsellsDialog.open(product, openCartIfEmpty));
</script>

<Header />
<UpsellsDialog bind:this={upsellsDialog} />
{@render children()}
