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
	import AdminUserTabsSessionsItem from './admin-user-tabs-sessions-item.svelte';
	import AdminUserTabsSessionsLoading from '../../loading/admin-user-tabs-sessions-loading.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	let { userId }: { userId: string } = $props();

	const sessions = useConvexPagination(
		api.betterAuth.tables.users.queries.fetchUserSessionsAdmin.fetchUserSessionsAdmin,
		() => ({ userId }),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => [userId]
		}
	);
</script>

<TabsContent value="sessions" class="min-w-0">
	<DataList
		pagination={sessions}
		key={(session) => session.id}
		placement="above"
		class="mt-3 gap-3"
	>
		{#snippet header()}
			<div class="mb-5 flex flex-col gap-1">
				<h2 class="text-lg font-semibold">{m['AdminUserPage.AdminUserTabsSessions.sessions']()}</h2>
				<p class="text-sm text-muted-foreground">
					{m['AdminUserPage.AdminUserTabsSessions.description']()}
				</p>
			</div>
		{/snippet}

		{#snippet children(session)}
			<AdminUserTabsSessionsItem {session} />
		{/snippet}

		{#snippet loadingSnippet()}
			<AdminUserTabsSessionsLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['AdminUserPage.AdminUserTabsSessions.loadError']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={m['AdminUserPage.AdminUserTabsSessions.noSessions']()}
				description={m['AdminUserPage.AdminUserTabsSessions.noSessionsDescription']()}
			>
				{#snippet icon()}
					<span class="icon-[lucide--monitor-smartphone] size-5"></span>
				{/snippet}
			</EmptyData>
		{/snippet}
	</DataList>
</TabsContent>
