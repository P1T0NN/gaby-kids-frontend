<script lang="ts">
	// COMPONENTS
	import Spinner from '@/components/ui/spinner/spinner.svelte';
	import { m } from '@/lib/paraglide/messages';

	let { total, showTotal = true }: { total?: number | null; showTotal?: boolean } = $props();
</script>

<div class="flex flex-col gap-1">
	<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
		{m['AdminUsersPage.AdminUsersHeader.adminLabel']()}
	</p>
	<h1 class="text-2xl font-semibold tracking-tight">
		{#if showTotal}
			{#if total != null}
				{m['AdminUsersPage.AdminUsersHeader.usersFound']({ count: total })}
			{:else}
				<span class="inline-flex items-center gap-1">
					{m['AdminUsersPage.AdminUsersHeader.usersLabel']()} - <Spinner />
					{m['AdminUsersPage.AdminUsersHeader.foundLabel']()}
				</span>
			{/if}
		{:else}
			{m['AdminUsersPage.AdminUsersHeader.filteredLabel']()}
		{/if}
	</h1>
	<p class="text-sm text-muted-foreground">{m['AdminUsersPage.AdminUsersHeader.description']()}</p>
</div>
