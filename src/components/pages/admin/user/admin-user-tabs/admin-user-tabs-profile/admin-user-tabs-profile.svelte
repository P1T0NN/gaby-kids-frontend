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
	import AdminUserTabsProfileLoading from '../../loading/admin-user-tabs-profile-loading.svelte';
	import AdminUserTabsProfileBanned from './admin-user-tabs-profile-banned.svelte';
	import AdminUserTabsProfileData from './admin-user-tabs-profile-data.svelte';
	import AdminUserTabsProfileLifecycle from './admin-user-tabs-profile-lifecycle.svelte';
	import { m } from '@/lib/paraglide/messages';

	let { userId }: { userId: string } = $props();

	const user = useCachedConvexQuery(
		api.betterAuth.tables.users.queries.fetchUserProfileAdmin.fetchUserProfileAdmin,
		() => ({ id: userId })
	);
</script>

<TabsContent value="profile" class="flex flex-col gap-8">
	{#if user.error}
		<Card.Root>
			<Card.Content class="p-6">
				<ErrorComponent message={m['AdminUserPage.AdminUserTabsProfile.loadError']()} />
			</Card.Content>
		</Card.Root>
	{:else if user.isLoading}
		<AdminUserTabsProfileLoading />
	{:else if user.data}
		<AdminUserTabsProfileData
			id={user.data.id}
			userId={user.data.userId}
			name={user.data.name}
			email={user.data.email}
			emailVerified={user.data.emailVerified}
			image={user.data.image}
			role={user.data.role}
			banned={user.data.banned}
		/>

		{#if user.data.banned}
			<AdminUserTabsProfileBanned
				banExpires={user.data.banExpires}
				banReason={user.data.banReason}
			/>
		{/if}

		<AdminUserTabsProfileLifecycle
			createdAt={user.data.createdAt}
			updatedAt={user.data.updatedAt}
		/>
	{:else}
		<EmptyData
			card
			title={m['AdminUserPage.AdminUserTabsProfile.userNotFound']()}
			description={m['AdminUserPage.AdminUserTabsProfile.userNotFoundDescription']()}
		>
			{#snippet icon()}
				<span class="icon-[lucide--user-round-x] size-5" aria-hidden="true"></span>
			{/snippet}
		</EmptyData>
	{/if}
</TabsContent>
