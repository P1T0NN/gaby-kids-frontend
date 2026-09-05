<script lang="ts">
	// AUTH
	import { authClient } from '@/features/auth/lib/authClient';

	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import { Spinner } from '@/components/ui/spinner';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';

	type Role = 'user' | 'admin';
	type AuthResult = { error?: { message?: string } | null } | null | undefined;
	type Props = {
		userId: string;
		currentRole: Role;
		selectedRole: Role;
	};

	let { userId, currentRole, selectedRole }: Props = $props();
	let pendingAction = $state<'role' | null>(null);

	async function saveRole(event: MouseEvent): Promise<void> {
		event.preventDefault();
		if (selectedRole === currentRole || pendingAction !== null) return;

		pendingAction = 'role';
		try {
			const result: AuthResult = await authClient.admin.setRole({
				userId,
				role: selectedRole
			});

			if (result?.error) {
				toastMessage({
					type: 'error',
					error: result.error,
					message: m['AdminUserPage.SaveRoleButton.roleUpdateError']()
				});
				return;
			}

			toastMessage({
				type: 'success',
				message: m['AdminUserPage.SaveRoleButton.roleUpdated']()
			});
		} catch (error) {
			toastMessage({
				type: 'error',
				error: error,
				message: m['AdminUserPage.SaveRoleButton.roleUpdateError']()
			});
		} finally {
			pendingAction = null;
		}
	}
</script>

<Button
	type="submit"
	variant="outline"
	size="sm"
	disabled={selectedRole === currentRole || pendingAction !== null}
	onclick={saveRole}
>
	{#if pendingAction === 'role'}<Spinner data-icon="inline-start" />{/if}
	{m['AdminUserPage.SaveRoleButton.saveRole']()}
</Button>
