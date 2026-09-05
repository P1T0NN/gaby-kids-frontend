<script lang="ts">
	// LIBRARIES
	import { authClient } from '@/features/auth/lib/authClient';

	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import { Spinner } from '@/components/ui/spinner';
	import { Textarea } from '@/components/ui/textarea';
	import { m } from '@/lib/paraglide/messages';

	// DATA
	import { banDurations, type BanDuration } from '@/shared/features/auth/data/authData';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';

	type AuthResult = { error?: { message?: string } | null } | null | undefined;
	type PendingAction = 'ban' | null;

	let { userId, userName }: { userId: string; userName: string } = $props();

	let banReason = $state('');
	let banDuration = $state<BanDuration>('indefinite');
	let pendingAction = $state<PendingAction>(null);
	const banDurationOptions = banDurations.map(({ value, labelKey }) => ({
		value,
		label: m[labelKey]()
	}));

	function getBanExpiresIn(): number | undefined {
		const seconds = {
			'one-day': 60 * 60 * 24,
			'seven-days': 60 * 60 * 24 * 7,
			'thirty-days': 60 * 60 * 24 * 30
		} satisfies Record<Exclude<BanDuration, 'indefinite'>, number>;

		return banDuration === 'indefinite' ? undefined : seconds[banDuration];
	}

	async function runAction(
		action: () => Promise<AuthResult>,
		successMessage: string,
		errorMessage: string
	): Promise<boolean> {
		pendingAction = 'ban';

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

	async function banUser(close: () => void): Promise<void> {
		const didBan = await runAction(
			() =>
				authClient.admin.banUser({
					userId,
					banReason: banReason.trim() || undefined,
					banExpiresIn: getBanExpiresIn()
				}),
			m['AdminUserPage.BanUserDialog.userBanned'](),
			m['AdminUserPage.BanUserDialog.banError']()
		);

		if (didBan) {
			banReason = '';
			banDuration = 'indefinite';
			close();
		}
	}
</script>

<NativeDialog>
	{#snippet trigger({ open })}
		<Button variant="destructive" size="sm" onclick={open} disabled={pendingAction !== null}>
			{m['AdminUserPage.BanUserDialog.banUser']()}
		</Button>
	{/snippet}

	{#snippet children({ close })}
		<form
			class="flex flex-col gap-5 p-6"
			onsubmit={(event) => {
				event.preventDefault();
				void banUser(close);
			}}
		>
			<div class="flex flex-col gap-1.5">
				<h2 class="text-lg font-semibold">
					{m['AdminUserPage.BanUserDialog.banTitle']({ name: userName })}
				</h2>
				<p class="text-sm text-muted-foreground">
					{m['AdminUserPage.BanUserDialog.banDescription']()}
				</p>
			</div>

			<FieldGroup>
				<Field>
					<FieldLabel for="ban-reason">
						{m['AdminUserPage.BanUserDialog.reason']()}
					</FieldLabel>
					<Textarea
						id="ban-reason"
						bind:value={banReason}
						maxlength={500}
						placeholder={m['AdminUserPage.BanUserDialog.reasonPlaceholder']()}
					/>
				</Field>

				<Field>
					<FieldLabel for="ban-duration">
						{m['AdminUserPage.BanUserDialog.duration']()}
					</FieldLabel>
					<NativeSelect
						id="ban-duration"
						options={banDurationOptions}
						bind:value={banDuration}
						label={m['AdminUserPage.BanUserDialog.duration']()}
						includePlaceholderOption={false}
					/>
				</Field>
			</FieldGroup>

			<div class="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onclick={close}
					disabled={pendingAction !== null}
				>
					{m['AdminUserPage.BanUserDialog.cancel']()}
				</Button>
				<Button type="submit" variant="destructive" size="sm" disabled={pendingAction !== null}>
					{#if pendingAction === 'ban'}<Spinner data-icon="inline-start" />{/if}
					{m['AdminUserPage.BanUserDialog.banUser']()}
				</Button>
			</div>
		</form>
	{/snippet}
</NativeDialog>
