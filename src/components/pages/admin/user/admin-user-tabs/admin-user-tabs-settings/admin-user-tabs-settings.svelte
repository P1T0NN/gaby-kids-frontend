<script lang="ts">
	// LIBRARIES
	import { useCachedConvexQuery } from '@/hooks/useCachedConvexQuery.svelte.js';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import * as Card from '@/components/ui/card';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import { TabsContent } from '@/components/ui/tabs';
	import AdminUserTabsSettingsLoading from '../../loading/admin-user-tabs-settings-loading.svelte';
	import AdminUserTabsSettingsAccess from './admin-user-tabs-settings-access.svelte';
	import AdminUserTabsSettingsDangerZone from './admin-user-tabs-settings-danger-zone.svelte';
	import { m } from '@/lib/paraglide/messages';

	let { userId }: { userId: string } = $props();

	const settings = useCachedConvexQuery(
		api.betterAuth.tables.users.queries.fetchUserSettingsAdmin.fetchUserSettingsAdmin,
		() => ({ id: userId })
	);
</script>

<TabsContent value="settings" class="flex flex-col gap-6">
	{#if settings.error}
		<Card.Root>
			<Card.Content class="p-6">
				<ErrorComponent message={m['AdminUserPage.AdminUserTabsSettings.loadError']()} />
			</Card.Content>
		</Card.Root>
	{:else if settings.isLoading}
		<AdminUserTabsSettingsLoading />
	{:else if settings.data}
		<AdminUserTabsSettingsAccess user={settings.data} />
		<AdminUserTabsSettingsDangerZone user={settings.data} />
	{:else}
		<EmptyData
			card
			title={m['AdminUserPage.AdminUserTabsSettings.userNotFound']()}
			description={m['AdminUserPage.AdminUserTabsSettings.userNotFoundDescription']()}
		>
			{#snippet icon()}
				<span class="icon-[lucide--user-round-x] size-5" aria-hidden="true"></span>
			{/snippet}
		</EmptyData>
	{/if}
</TabsContent>
