<script lang="ts">
	// LIBRARIES
	import { useAuth } from '../../hooks/useAuth.svelte';
	import { useCaptcha } from '@/features/captcha/hooks/useCaptcha.svelte';
	import { m } from '@/lib/paraglide/messages';

	// CONSTANTS
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import AuthFormShell from '../auth-form-shell/auth-form-shell.svelte';
	import EmailInput from '@/components/ui/custom-components/email-input/email-input.svelte';
	import OtpField from '../otp-field/otp-field.svelte';
	import PasswordInput from '@/components/ui/custom-components/password-input/password-input.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// TYPES
	import type { ComponentProps } from 'svelte';

	let { ...restProps }: ComponentProps<typeof Card.Root> = $props();

	const auth = useAuth();
	const captcha = useCaptcha();

	let step = $state<'email' | 'reset'>('email');
	let email = $state('');
	let otp = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (step === 'email') {
			if (!captcha.token) return;
			try {
				await auth.requestPasswordReset(email, captcha.token);
			} finally {
				captcha.reset();
			}
			if (!auth.error) step = 'reset';
			return;
		}

		if (password !== confirmPassword) {
			auth.setError('PASSWORDS_DO_NOT_MATCH');
			return;
		}

		if (!captcha.token) return;
		try {
			await auth.resetPassword(email, otp, password, captcha.token);
		} finally {
			captcha.reset();
		}
	}
</script>

<AuthFormShell
	{...restProps}
	title={step === 'email'
		? m['AuthFeature.ForgotPasswordForm.forgotYourPassword']()
		: m['AuthFeature.ForgotPasswordForm.setNewPassword']()}
	description={step === 'email'
		? m['AuthFeature.ForgotPasswordForm.emailResetDescription']()
		: m['AuthFeature.ForgotPasswordForm.resetCodeDescription']()}
	submitting={auth.submitting}
	error={auth.error}
	{captcha}
	onsubmit={handleSubmit}
	submitLabel={step === 'email'
		? m['AuthFeature.ForgotPasswordForm.sendResetCode']()
		: m['AuthFeature.ForgotPasswordForm.resetPassword']()}
	submitDisabled={step === 'reset' && otp.length < 6}
>
	{#if step === 'email'}
		<Field.Field>
			<Field.Label for="email">{m['AuthFeature.ForgotPasswordForm.email']()}</Field.Label>
			<EmailInput id="email" required bind:value={email} />
		</Field.Field>
	{:else}
		<OtpField label={m['AuthFeature.ForgotPasswordForm.verificationCode']()} bind:value={otp} />

		<Field.Field>
			<Field.Label for="password">{m['AuthFeature.ForgotPasswordForm.newPassword']()}</Field.Label>
			<PasswordInput id="password" required bind:value={password} />
			<Field.Description
				>{m['AuthFeature.ForgotPasswordForm.passwordLengthDescription']()}</Field.Description
			>
		</Field.Field>

		<Field.Field>
			<Field.Label for="confirm-password"
				>{m['AuthFeature.ForgotPasswordForm.confirmPassword']()}</Field.Label
			>
			<PasswordInput id="confirm-password" required bind:value={confirmPassword} />
		</Field.Field>
	{/if}
	{#snippet footer()}
		<Card.Footer class="flex justify-center">
			<Field.Description>
				<Link href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN} class="text-sm font-medium"
					>{m['AuthFeature.ForgotPasswordForm.backToSignIn']()}</Link
				>
			</Field.Description>
		</Card.Footer>
	{/snippet}
</AuthFormShell>
