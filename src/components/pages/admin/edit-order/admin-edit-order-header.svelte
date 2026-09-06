<script lang="ts">
	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import { m } from '@/lib/paraglide/messages';

	let { orderId }: { orderId: string } = $props();

	const reference = $derived(orderId.slice(-8).toUpperCase());
</script>

<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div class="flex flex-col gap-1">
		<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
			{m['AdminEditOrderPage.AdminEditOrderHeader.adminLabel']()}
		</p>

		<h1 class="text-2xl font-semibold tracking-tight">
			{m['AdminEditOrderPage.AdminEditOrderHeader.heading']({ id: reference })}
		</h1>

		<p class="text-sm text-muted-foreground">
			{m['AdminEditOrderPage.AdminEditOrderHeader.description']()}
		</p>
	</div>

	<ButtonLink href={ADMIN_PAGE_ENDPOINTS.ORDERS} variant="outline" size="sm">
		<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
		{m['AdminEditOrderPage.AdminEditOrderHeader.back']()}
	</ButtonLink>
</header>
