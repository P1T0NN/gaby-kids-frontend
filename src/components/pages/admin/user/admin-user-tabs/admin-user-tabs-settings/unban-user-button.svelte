<script lang="ts">
	// LIBRARIES
	import { authClient } from '@/features/auth/lib/authClient';

	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import { Spinner } from '@/components/ui/spinner';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';

	type AuthResult = { error?: { message?: string } | null } | null | undefined;
	type PendingAction = 'unban' | null;

	let { userId }: { userId: string } = $props();

	let pendingAction = $state<PendingAction>(null);

	async function unbanUser(): Promise<void> {
		pendingAction = 'unban';

		try {
			const result: AuthResult = await authClient.admin.unbanUser({ userId });
			if (result?.error) {
				toastMessage({
					type: 'error',
					error: result.error,
					message: m['AdminUserPage.UnbanUserButton.unbanError']()
				});
				return;
			}

			toastMessage({
				type: 'success',
				message: m['AdminUserPage.UnbanUserButton.userUnbanned']()
			});
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: m['AdminUserPage.UnbanUserButton.unbanError']()
			});
		} finally {
			pendingAction = null;
		}
	}
</script>

<Button variant="outline" size="sm" disabled={pendingAction !== null} onclick={unbanUser}>
	{#if pendingAction === 'unban'}<Spinner data-icon="inline-start" />{/if}
	{m['AdminUserPage.UnbanUserButton.unbanUser']()}
</Button>
