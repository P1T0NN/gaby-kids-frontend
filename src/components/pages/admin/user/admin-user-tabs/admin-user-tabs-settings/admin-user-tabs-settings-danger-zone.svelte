<script lang="ts">
	// SVELTEKIT
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	// LIBRARIES
	import type { FunctionReturnType } from 'convex/server';

	// CONVEX
	import type { api } from '@convex/_generated/api';

	// AUTH
	import { authClient } from '@/features/auth/lib/authClient';

	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import * as Card from '@/components/ui/card';
	import { Field, FieldLabel } from '@/components/ui/field';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Input } from '@/components/ui/input';
	import { Spinner } from '@/components/ui/spinner';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';

	type User = NonNullable<
		FunctionReturnType<
			typeof api.betterAuth.tables.users.queries.fetchUserSettingsAdmin.fetchUserSettingsAdmin
		>
	>;
	type PendingAction = 'delete' | null;
	type AuthResult = { error?: { message?: string } | null } | null | undefined;

	let { user }: { user: User } = $props();

	let deleteConfirmation = $state('');
	let pendingAction = $state<PendingAction>(null);

	async function runAction(
		action: () => Promise<AuthResult>,
		successMessage: string,
		errorMessage: string
	): Promise<boolean> {
		pendingAction = 'delete';

		try {
			const result = await action();
			if (result?.error) {
				toastMessage({ type: 'error', error: result.error, message: errorMessage });
				return false;
			}

			toastMessage({ type: 'success', message: successMessage });
			return true;
		} catch (error) {
			toastMessage({ type: 'error', error, message: errorMessage });
			return false;
		} finally {
			pendingAction = null;
		}
	}

	async function deleteUser(close: () => void): Promise<void> {
		if (deleteConfirmation.trim() !== user.email) return;

		const didDelete = await runAction(
			() => authClient.admin.removeUser({ userId: user.id }),
			m['AdminUserPage.AdminUserTabsSettingsDangerZone.userDeleted'](),
			m['AdminUserPage.AdminUserTabsSettingsDangerZone.deleteError']()
		);

		if (didDelete) {
			close();
			await goto(resolve('/admin/users'));
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

							<div class="flex justify-end gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onclick={close}
									disabled={pendingAction !== null}
								>
									{m['AdminUserPage.AdminUserTabsSettingsDangerZone.cancel']()}
								</Button>
								<Button
									type="submit"
									variant="destructive"
									size="sm"
									disabled={deleteConfirmation.trim() !== user.email || pendingAction !== null}
								>
									{#if pendingAction === 'delete'}<Spinner data-icon="inline-start" />{/if}
									{m['AdminUserPage.AdminUserTabsSettingsDangerZone.deleteAccount']()}
								</Button>
							</div>
						</form>
					{/snippet}
				</NativeDialog>
			</div>
		</div>
	</Card.Content>
</Card.Root>
