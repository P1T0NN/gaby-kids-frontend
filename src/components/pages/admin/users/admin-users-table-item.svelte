<script lang="ts">
	// SVELTEKIT IMPORTS
	import { resolve } from '$app/paths';

	// LIBRARIES
	import type { FunctionReturnType } from 'convex/server';

	// CONVEX
	import type { api } from '@convex/_generated/api';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge';
	import NativeAvatar from '@/components/ui/native-components/native-avatar/native-avatar.svelte';
	import { TableCell } from '@/components/ui/table';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// UTILS
	import { formatDate } from '@/shared/utils/date';

	type User = FunctionReturnType<
		typeof api.betterAuth.tables.users.queries.fetchUsersAdmin.fetchUsersAdmin
	>['items'][number];

	let { user }: { user: User } = $props();
</script>

<TableCell>
	<Link
		href={resolve('/admin/users/[id]', { id: user.id })}
		class="group inline-flex max-w-full min-w-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
	>
		<NativeAvatar name={user.name} image={user.image} size="sm" />
		<div class="min-w-0">
			<p class="truncate font-medium group-hover:underline">{user.name}</p>
			<p class="truncate text-xs text-muted-foreground group-hover:underline">{user.email}</p>
		</div>
	</Link>
</TableCell>
<TableCell>
	<Badge variant={user.role === 'admin' ? 'default' : 'secondary'} class="capitalize">
		{user.role}
	</Badge>
</TableCell>
<TableCell>
	{#if user.banned}
		<Badge variant="destructive">{m['AdminUsersPage.AdminUsersTableItem.suspended']()}</Badge>
	{:else if user.emailVerified}
		<Badge variant="outline" class="border-primary/30 bg-primary/5 text-primary">
			{m['AdminUsersPage.AdminUsersTableItem.verified']()}
		</Badge>
	{:else}
		<Badge variant="outline">{m['AdminUsersPage.AdminUsersTableItem.unverified']()}</Badge>
	{/if}
</TableCell>
<TableCell class="hidden whitespace-nowrap text-muted-foreground md:table-cell">
	{formatDate(user.createdAt, getLocale())}
</TableCell>
