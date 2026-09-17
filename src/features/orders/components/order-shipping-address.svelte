<script lang="ts">
	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	let { address, label }: { address: Doc<'orders'>['shippingAddress']; label: string } = $props();
</script>

{#if address}
	<div class="sm:col-span-2">
		<p class="text-xs text-muted-foreground">{label}</p>
		<address class="mt-1 font-medium not-italic">
			{address.street}{#if address.apartment}, {address.apartment}{/if}<br />
			{address.postalCode}
			{address.city},
			{address.country}
		</address>
	</div>
{/if}
