<script lang="ts">
	// COMPONENTS
	import ForgotPasswordForm from '@/features/auth/components/forgot-password-form/forgot-password-form.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
</script>

<SvelteHead title="Forgot password" noindex />

<div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
	<div class="w-full max-w-sm">
		<ForgotPasswordForm />
	</div>
</div>
