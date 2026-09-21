<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AdminDashboardHeaderTimeranges from './admin-dashboard-header-timeranges.svelte';
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
	<div class="flex flex-col gap-1">
		<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
			{m['AdminDashboardPage.adminLabel']()}
		</p>
		<h1 class="text-2xl font-semibold tracking-tight">{m['AdminDashboardPage.dashboard']()}</h1>
	</div>

	<AdminDashboardHeaderTimeranges />
</div>
