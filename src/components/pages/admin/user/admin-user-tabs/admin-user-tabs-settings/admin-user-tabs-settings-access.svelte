<script lang="ts">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge';
	import * as Card from '@/components/ui/card';
	import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import { Separator } from '@/components/ui/separator';
	import BanUserDialog from './ban-user-dialog.svelte';
	import SaveRoleButton from './save-role-button.svelte';
	import UnbanUserButton from './unban-user-button.svelte';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// UTILS
	import { formatDateTime } from '@/shared/utils/date';

	// TYPES
	import type { api } from '@convex/_generated/api';
	import type { FunctionReturnType } from 'convex/server';

	type User = NonNullable<
		FunctionReturnType<
			typeof api.betterAuth.tables.users.queries.fetchUserSettingsAdmin.fetchUserSettingsAdmin
		>
	>;
	type Role = 'user' | 'admin';

	let { user }: { user: User } = $props();

	const currentRole = $derived<Role>(user.role === 'admin' ? 'admin' : 'user');
	let selectedRole = $derived<Role>(currentRole);

	const roleOptions = [
		{ value: 'user', label: m['AdminUserPage.AdminUserTabsSettingsAccess.userRole']() },
		{ value: 'admin', label: m['AdminUserPage.AdminUserTabsSettingsAccess.adminRole']() }
	];

	// Surfaces the pending change before it's saved — role edits are exactly the
	// kind of "select and forget" mistake worth flagging in an admin panel.
	const hasPendingRoleChange = $derived(selectedRole !== currentRole);
	const selectedRoleLabel = $derived(
		roleOptions.find((option) => option.value === selectedRole)?.label ?? selectedRole
	);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{m['AdminUserPage.AdminUserTabsSettingsAccess.access']()}</Card.Title>
		<Card.Description
			>{m['AdminUserPage.AdminUserTabsSettingsAccess.description']()}</Card.Description
		>
	</Card.Header>

	<Card.Content>
		<FieldGroup>
			<form class="flex flex-col gap-3" onsubmit={(event) => event.preventDefault()}>
				<Field>
					<div class="flex items-center justify-between gap-2">
						<FieldLabel>{m['AdminUserPage.AdminUserTabsSettingsAccess.role']()}</FieldLabel>
						<Badge variant={user.role === 'admin' ? 'default' : 'secondary'} class="capitalize">
							{user.role}
						</Badge>
					</div>

					<div class="flex flex-wrap items-center gap-3">
						<NativeSelect
							options={roleOptions}
							bind:value={selectedRole}
							label={m['AdminUserPage.AdminUserTabsSettingsAccess.role']()}
							includePlaceholderOption={false}
						/>

						<SaveRoleButton userId={user.id} {currentRole} {selectedRole} />
					</div>

					{#if hasPendingRoleChange}
						<p class="text-xs font-medium text-amber-600 dark:text-amber-400">
							{m['AdminUserPage.AdminUserTabsSettingsAccess.pendingRoleChange']({
								role: selectedRoleLabel
							})}
						</p>
					{/if}

					<FieldDescription>
						{m['AdminUserPage.AdminUserTabsSettingsAccess.adminsCanManage']()}
					</FieldDescription>
				</Field>
			</form>

			<Separator />

			<div class="flex flex-col gap-3">
				<div class="flex items-center justify-between gap-2">
					<h3 class="text-sm font-semibold">
						{m['AdminUserPage.AdminUserTabsSettingsAccess.accountAccess']()}
					</h3>
					<Badge variant={user.banned ? 'destructive' : 'outline'}>
						{user.banned
							? m['AdminUserPage.AdminUserTabsSettingsAccess.banned']()
							: m['AdminUserPage.AdminUserTabsSettingsAccess.active']()}
					</Badge>
				</div>

				<p class="text-sm text-muted-foreground">
					{#if user.banned}
						{user.banExpires
							? m['AdminUserPage.AdminUserTabsSettingsAccess.accessBlockedUntil']({
									date: formatDateTime(user.banExpires, getLocale())
								})
							: m['AdminUserPage.AdminUserTabsSettingsAccess.accessBlockedNoExpiration']()}
					{:else}
						{m['AdminUserPage.AdminUserTabsSettingsAccess.userCanSignIn']()}
					{/if}
				</p>

				{#if user.banned}
					<UnbanUserButton userId={user.id} />
				{:else}
					<BanUserDialog userId={user.id} userName={user.name} />
				{/if}
			</div>
		</FieldGroup>
	</Card.Content>
</Card.Root>
