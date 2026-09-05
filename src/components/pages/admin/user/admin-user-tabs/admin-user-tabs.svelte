<script lang="ts">
	// COMPONENTS
	import AdminUserTabsProfile from './admin-user-tabs-profile/admin-user-tabs-profile.svelte';
	import AdminUserTabsSettings from './admin-user-tabs-settings/admin-user-tabs-settings.svelte';
	import AdminUserTabsSessions from './admin-user-tabs-sessions/admin-user-tabs-sessions.svelte';
	import AdminUserTabsLogs from './admin-user-tabs-logs/admin-user-tabs-logs.svelte';
	import TabsUrl from '@/components/ui/custom-components/tabs-url/tabs-url.svelte';
	import { TabsList, TabsTrigger } from '@/components/ui/tabs';
	import { m } from '@/lib/paraglide/messages';

	let { userId }: { userId: string } = $props();
</script>

<TabsUrl param="tab" defaultValue="profile" class="gap-5">
	{#snippet children(activeTab)}
		<TabsList aria-label={m['AdminUserPage.AdminUserTabs.userDetails']()}>
			<TabsTrigger value="profile">{m['AdminUserPage.AdminUserTabs.profile']()}</TabsTrigger>
			<TabsTrigger value="settings">{m['AdminUserPage.AdminUserTabs.settings']()}</TabsTrigger>
			<TabsTrigger value="sessions">{m['AdminUserPage.AdminUserTabs.sessions']()}</TabsTrigger>
			<TabsTrigger value="logs">{m['AdminUserPage.AdminUserTabs.logs']()}</TabsTrigger>
		</TabsList>

		{#if activeTab === 'profile'}
			<AdminUserTabsProfile {userId} />
		{:else if activeTab === 'settings'}
			<AdminUserTabsSettings {userId} />
		{:else if activeTab === 'sessions'}
			<AdminUserTabsSessions {userId} />
		{:else}
			<AdminUserTabsLogs {userId} />
		{/if}
	{/snippet}
</TabsUrl>
