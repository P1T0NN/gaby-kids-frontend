<script lang="ts">
	// COMPONENTS
	import SignUpForm from '@/features/auth/components/sign-up-form/sign-up-form.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
</script>

<SvelteHead title="Sign up" noindex />

<div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
	<div class="w-full max-w-sm">
		<SignUpForm />
	</div>
</div>
