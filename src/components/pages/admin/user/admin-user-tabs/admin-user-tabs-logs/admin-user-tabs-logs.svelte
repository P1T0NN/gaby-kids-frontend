<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config';

	// COMPONENTS
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import { TabsContent } from '@/components/ui/tabs';
	import { m } from '@/lib/paraglide/messages';
	import AdminUserTabsLogsItem from './admin-user-tabs-logs-item.svelte';
	import AdminUserTabsLogsLoading from '../../loading/admin-user-tabs-logs-loading.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	let { userId }: { userId: string } = $props();

	const logs = useConvexPagination(
		api.betterAuth.tables.users.queries.fetchUserLogsAdmin.fetchUserLogsAdmin,
		() => ({ userId }),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => [userId]
		}
	);
</script>

<TabsContent value="logs" class="min-w-0">
	<DataList pagination={logs} key={(log) => log.id} placement="above" class="mt-4 gap-3">
		{#snippet header()}
			<div class="mb-4 flex flex-col gap-1">
				<h2 class="text-lg font-semibold">{m['AdminUserPage.AdminUserTabsLogs.logs']()}</h2>
				<p class="text-sm text-muted-foreground">
					{m['AdminUserPage.AdminUserTabsLogs.description']()}
				</p>
			</div>
		{/snippet}

		{#snippet children(log)}
			<AdminUserTabsLogsItem {log} />
		{/snippet}

		{#snippet loadingSnippet()}
			<AdminUserTabsLogsLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['AdminUserPage.AdminUserTabsLogs.loadError']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={m['AdminUserPage.AdminUserTabsLogs.noActivity']()}
				description={m['AdminUserPage.AdminUserTabsLogs.noActivityDescription']()}
			>
				{#snippet icon()}
					<span class="icon-[lucide--history] size-5"></span>
				{/snippet}
			</EmptyData>
		{/snippet}
	</DataList>
</TabsContent>
