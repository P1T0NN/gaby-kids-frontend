<script lang="ts">
	// COMPONENTS
	import AdminUpsellsAddDialog from './admin-upsells-add-dialog/admin-upsells-add-dialog.svelte';

	// TRANSLATIONS
	import { m } from '@/lib/paraglide/messages';
</script>

<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
	<div class="flex flex-col gap-1">
		<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
			{m['AdminUpsellsPage.AdminUpsellsHeader.adminLabel']()}
		</p>
		<h1 class="text-2xl font-semibold tracking-tight">
			{m['AdminUpsellsPage.AdminUpsellsHeader.title']()}
		</h1>
		<p class="max-w-prose text-sm text-muted-foreground">
			{m['AdminUpsellsPage.AdminUpsellsHeader.description']()}
		</p>
	</div>

	<AdminUpsellsAddDialog />
</header>
