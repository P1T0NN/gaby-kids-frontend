<script lang="ts">
	// COMPONENTS
	import VerifyEmailForm from '@/features/auth/components/verify-email-form/verify-email-form.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
</script>

<SvelteHead title="Verify email" noindex />

<div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
	<div class="w-full max-w-sm">
		<VerifyEmailForm />
	</div>
</div>
