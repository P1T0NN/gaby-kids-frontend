<script lang="ts">
	// LIBRARIES
	import { useAuth } from '../../hooks/useAuth.svelte';
	import { useCaptcha } from '@/features/captcha/hooks/useCaptcha.svelte';
	import { useSearchParams } from '@/hooks/useSearchParams.svelte';
	import { m } from '@/lib/paraglide/messages';
	import { onMount } from 'svelte';

	// CONSTANTS
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { toast } from 'svelte-sonner';
	import AuthFormShell from '../auth-form-shell/auth-form-shell.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import OtpField from '../otp-field/otp-field.svelte';

	// TYPES
	import type { ComponentProps } from 'svelte';

	let { ...restProps }: ComponentProps<typeof Card.Root> = $props();

	const auth = useAuth();
	const captcha = useCaptcha();
	const params = useSearchParams();

	// Pre-fill from the redirect after sign-up: /verify-email?email=...
	let email = $state(params.get('email') ?? '');
	let otp = $state('');
	let currentTime = $state(Date.now());
	let resendAvailableAt = $state<number | null>(null);

	const RESEND_COOLDOWN_MS = 60_000;

	const resendCooldown = $derived(
		resendAvailableAt === null
			? 0
			: Math.max(0, Math.ceil((resendAvailableAt - currentTime) / 1000))
	);

	onMount(() => {
		const timer = setInterval(() => {
			if (resendAvailableAt === null) return;

			currentTime = Date.now();

			if (currentTime >= resendAvailableAt) {
				resendAvailableAt = null;
			}
		}, 1000);

		return () => clearInterval(timer);
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!captcha.token) return;
		try {
			await auth.verifyEmail(email, otp, captcha.token);
		} finally {
			captcha.reset();
		}
	}

	async function handleResend() {
		if (auth.submitting || resendCooldown > 0 || email.length === 0 || !captcha.token) return;

		try {
			await auth.sendVerificationOtp(email, captcha.token);
		} finally {
			captcha.reset();
		}

		if (auth.error) return;

		currentTime = Date.now();
		resendAvailableAt = currentTime + RESEND_COOLDOWN_MS;
		toast.success(m['AuthFeature.VerifyEmailForm.anotherVerificationCode']());
	}
</script>

<AuthFormShell
	{...restProps}
	title={m['AuthFeature.VerifyEmailForm.verifyYourEmail']()}
	description={m['AuthFeature.VerifyEmailForm.verifyEmailDescription']()}
	submitting={auth.submitting}
	error={auth.error}
	{captcha}
	onsubmit={handleSubmit}
	submitLabel={m['AuthFeature.VerifyEmailForm.verifyEmail']()}
	submitDisabled={otp.length < 6}
>
	<Field.Field>
		<Field.Label for="email">{m['AuthFeature.VerifyEmailForm.email']()}</Field.Label>
		<Input
			id="email"
			type="email"
			placeholder={m['AuthFeature.VerifyEmailForm.emailPlaceholder']()}
			required
			bind:value={email}
		/>
	</Field.Field>

	<OtpField label={m['AuthFeature.VerifyEmailForm.verificationCode']()} bind:value={otp} />
	{#snippet footer()}
		<Card.Footer class="flex justify-center">
			<Field.Description class="flex items-center justify-center gap-2">
				<span>{m['AuthFeature.VerifyEmailForm.didntReceiveCode']()}</span>
				<Button
					variant="outline"
					size="sm"
					type="button"
					disabled={auth.submitting || resendCooldown > 0 || email.length === 0 || !captcha.token}
					onclick={handleResend}
				>
					{#if resendCooldown > 0}
						{m['AuthFeature.VerifyEmailForm.resendCodeIn']({ seconds: resendCooldown })}
					{:else}
						{m['AuthFeature.VerifyEmailForm.resendCode']()}
					{/if}
				</Button>
			</Field.Description>
		</Card.Footer>

		<Card.Footer class="flex justify-center">
			<Field.Description>
				<Link href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN} class="text-sm font-medium"
					>{m['AuthFeature.VerifyEmailForm.backToSignIn']()}</Link
				>
			</Field.Description>
		</Card.Footer>
	{/snippet}
</AuthFormShell>
