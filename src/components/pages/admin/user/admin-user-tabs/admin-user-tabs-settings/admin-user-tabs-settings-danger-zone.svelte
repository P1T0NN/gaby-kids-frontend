<script lang="ts">
	// SVELTEKIT
	import { gotoParaglide } from '@/utils/gotoParaglide.js';
	import { resolve } from '$app/paths';

	// LIBRARIES
	import type { FunctionReturnType } from 'convex/server';

	// CONVEX
	import type { api } from '@convex/_generated/api';

	// AUTH
	import { authClient } from '@/features/auth/lib/authClient';
	import { runAuthAction } from '@/features/auth/lib/runAuthAction';

	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import * as Card from '@/components/ui/card';
	import ConfirmDialogActions from '@/components/ui/custom-components/confirm-dialog-actions/confirm-dialog-actions.svelte';
	import { Field, FieldLabel } from '@/components/ui/field';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Input } from '@/components/ui/input';
	import { m } from '@/lib/paraglide/messages';

	type User = NonNullable<
		FunctionReturnType<
			typeof api.betterAuth.tables.users.queries.fetchUserSettingsAdmin.fetchUserSettingsAdmin
		>
	>;
	type PendingAction = 'delete' | null;

	let { user }: { user: User } = $props();

	let deleteConfirmation = $state('');
	let pendingAction = $state<PendingAction>(null);

	async function deleteUser(close: () => void): Promise<void> {
		if (deleteConfirmation.trim() !== user.email) return;

		pendingAction = 'delete';
		const didDelete = await runAuthAction(
			() => authClient.admin.removeUser({ userId: user.id }),
			m['AdminUserPage.AdminUserTabsSettingsDangerZone.userDeleted'](),
			m['AdminUserPage.AdminUserTabsSettingsDangerZone.deleteError']()
		);
		pendingAction = null;

		if (didDelete) {
			close();
			await gotoParaglide(resolve('/admin/users'));
		}
	}
</script>

<Card.Root class="border border-destructive/40">
	<Card.Header>
		<Card.Title class="flex items-center gap-2 text-destructive">
			<span class="icon-[lucide--triangle-alert] size-4" aria-hidden="true"></span>
			{m['AdminUserPage.AdminUserTabsSettingsDangerZone.dangerZone']()}
		</Card.Title>
		<Card.Description>
			{m['AdminUserPage.AdminUserTabsSettingsDangerZone.description']()}
		</Card.Description>
	</Card.Header>

	<Card.Content>
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-1">
				<h3 class="text-sm font-semibold">
					{m['AdminUserPage.AdminUserTabsSettingsDangerZone.deleteAccount']()}
				</h3>
				<p class="text-sm text-muted-foreground">
					{m['AdminUserPage.AdminUserTabsSettingsDangerZone.deleteDescription']()}
				</p>
			</div>

			<div>
				<NativeDialog>
					{#snippet trigger({ open })}
						<Button
							variant="destructive"
							size="sm"
							onclick={open}
							disabled={pendingAction !== null}
						>
							{m['AdminUserPage.AdminUserTabsSettingsDangerZone.deleteAccount']()}
						</Button>
					{/snippet}

					{#snippet children({ close })}
						<form
							class="flex flex-col gap-5 p-6"
							onsubmit={(event) => {
								event.preventDefault();
								void deleteUser(close);
							}}
						>
							<div class="flex flex-col gap-1.5">
								<h2 class="text-lg font-semibold">
									{m['AdminUserPage.AdminUserTabsSettingsDangerZone.deleteConfirmationTitle']({
										name: user.name
									})}
								</h2>
								<p class="text-sm text-muted-foreground">
									{m[
										'AdminUserPage.AdminUserTabsSettingsDangerZone.deleteConfirmationDescription'
									]()}
								</p>
							</div>

							<Field>
								<FieldLabel for="delete-confirmation">
									{m['AdminUserPage.AdminUserTabsSettingsDangerZone.typeToConfirm']({
										email: user.email
									})}
								</FieldLabel>
								<Input
									id="delete-confirmation"
									bind:value={deleteConfirmation}
									autocomplete="off"
									spellcheck="false"
								/>
							</Field>

							<ConfirmDialogActions
								pending={pendingAction !== null}
								cancelLabel={m['AdminUserPage.AdminUserTabsSettingsDangerZone.cancel']()}
								confirmLabel={m['AdminUserPage.AdminUserTabsSettingsDangerZone.deleteAccount']()}
								confirmType="submit"
								confirmDisabled={deleteConfirmation.trim() !== user.email}
								onCancel={close}
							/>
						</form>
					{/snippet}
				</NativeDialog>
			</div>
		</div>
	</Card.Content>
</Card.Root>
