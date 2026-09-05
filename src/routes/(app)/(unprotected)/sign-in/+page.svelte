<script lang="ts">
	// COMPONENTS
	import SignInForm from '@/features/auth/components/sign-in-form/sign-in-form.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
</script>

<SvelteHead title="Sign in" noindex />

<div class="flex h-screen w-full items-center justify-center px-4">
	<SignInForm />
</div>
