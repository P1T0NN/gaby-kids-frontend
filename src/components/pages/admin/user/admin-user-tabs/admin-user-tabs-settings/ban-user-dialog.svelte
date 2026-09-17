<script lang="ts">
	// LIBRARIES
	import { authClient } from '@/features/auth/lib/authClient';
	import { runAuthAction } from '@/features/auth/lib/runAuthAction';

	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import ConfirmDialogActions from '@/components/ui/custom-components/confirm-dialog-actions/confirm-dialog-actions.svelte';
	import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import { Textarea } from '@/components/ui/textarea';
	import { m } from '@/lib/paraglide/messages';

	// DATA
	import { banDurations, type BanDuration } from '@/shared/features/auth/data/authData';

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

	async function banUser(close: () => void): Promise<void> {
		pendingAction = 'ban';
		const didBan = await runAuthAction(
			() =>
				authClient.admin.banUser({
					userId,
					banReason: banReason.trim() || undefined,
					banExpiresIn: getBanExpiresIn()
				}),
			m['AdminUserPage.BanUserDialog.userBanned'](),
			m['AdminUserPage.BanUserDialog.banError']()
		);
		pendingAction = null;

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

			<ConfirmDialogActions
				pending={pendingAction !== null}
				cancelLabel={m['AdminUserPage.BanUserDialog.cancel']()}
				confirmLabel={m['AdminUserPage.BanUserDialog.banUser']()}
				confirmType="submit"
				onCancel={close}
			/>
		</form>
	{/snippet}
</NativeDialog>
