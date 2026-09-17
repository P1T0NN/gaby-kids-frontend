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
	import PasswordInput from '@/components/ui/custom-components/password-input/password-input.svelte';
	import { Input } from '@/components/ui/input/index.js';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// TYPES
	import type { ComponentProps } from 'svelte';

	let { ...restProps }: ComponentProps<typeof Card.Root> = $props();

	const auth = useAuth();
	const captcha = useCaptcha();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (password !== confirmPassword) {
			auth.setError('PASSWORDS_DO_NOT_MATCH');
			return;
		}
		if (!captcha.token) return;

		try {
			await auth.signUpWithEmail(
				email,
				password,
				name,
				m['AuthFeature.SignUpForm.verificationCodeToast'](),
				captcha.token
			);
		} finally {
			captcha.reset();
		}
	}

	async function handleGoogleSignIn() {
		if (!captcha.token) return;
		try {
			await auth.signInWithGoogle(captcha.token);
		} finally {
			captcha.reset();
		}
	}
</script>

<AuthFormShell
	{...restProps}
	title={m['AuthFeature.SignUpForm.createAccount']()}
	description={m['AuthFeature.SignUpForm.createAccountDescription']()}
	submitting={auth.submitting}
	error={auth.error}
	{captcha}
	onsubmit={handleSubmit}
	submitLabel={m['AuthFeature.SignUpForm.createAccount']()}
	google={{
		label: m['AuthFeature.SignUpForm.continueWithGoogle'](),
		onclick: handleGoogleSignIn
	}}
>
	<Field.Field>
		<Field.Label for="name">{m['AuthFeature.SignUpForm.fullName']()}</Field.Label>
		<Input
			id="name"
			type="text"
			placeholder={m['AuthFeature.SignUpForm.fullNamePlaceholder']()}
			required
			bind:value={name}
		/>
	</Field.Field>

	<Field.Field>
		<Field.Label for="email">{m['AuthFeature.SignUpForm.email']()}</Field.Label>
		<EmailInput id="email" required bind:value={email} />
		<Field.Description>
			{m['AuthFeature.SignUpForm.emailDescription']()}
		</Field.Description>
	</Field.Field>

	<Field.Field>
		<Field.Label for="password">{m['AuthFeature.SignUpForm.password']()}</Field.Label>
		<PasswordInput id="password" required bind:value={password} />
		<Field.Description>{m['AuthFeature.SignUpForm.passwordLengthDescription']()}</Field.Description>
	</Field.Field>

	<Field.Field>
		<Field.Label for="confirm-password">{m['AuthFeature.SignUpForm.confirmPassword']()}</Field.Label
		>
		<PasswordInput id="confirm-password" required bind:value={confirmPassword} />
		<Field.Description>{m['AuthFeature.SignUpForm.confirmPasswordDescription']()}</Field.Description
		>
	</Field.Field>
	{#snippet actionsFooter()}
		<Field.Description class="px-6 text-center">
			{m['AuthFeature.SignUpForm.alreadyHaveAccount']()}
			<Link href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN}>{m['AuthFeature.SignUpForm.signIn']()}</Link>
		</Field.Description>
	{/snippet}
</AuthFormShell>
