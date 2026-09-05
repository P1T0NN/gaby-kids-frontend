<script lang="ts">
	// SVELTEKIT IMPORTS
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { authClient } from '@/features/auth/lib/authClient';
	import { convexQueryCache } from '@/lib/clientCache/clientCache.js';
	import { m } from '@/lib/paraglide/messages';

	// CONSTANTS
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';

	// COMPONENTS
	import { toast } from 'svelte-sonner';
	import { Spinner } from '@/components/ui/spinner';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let {
		children,
		class: className,
		disabled,
		...restProps
	}: HTMLButtonAttributes & { children: Snippet; class?: string } = $props();

	let isLoggingOut = $state(false);

	async function handleLogout(): Promise<void> {
		if (isLoggingOut) return;

		isLoggingOut = true;
		try {
			await authClient.signOut();
			convexQueryCache.clear();
			toast.success(m['AuthFeature.LogoutButton.signedOutSuccessfully']());
			await goto(UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN);
		} finally {
			isLoggingOut = false;
		}
	}
</script>

<button
	type="button"
	{...restProps}
	disabled={disabled || isLoggingOut}
	aria-busy={isLoggingOut}
	onclick={handleLogout}
	class={className}
>
	{#if isLoggingOut}
		<Spinner data-icon="inline-start" aria-label={m['AuthFeature.LogoutButton.signingOut']()} />
		<span>{m['AuthFeature.LogoutButton.signingOutEllipsis']()}</span>
	{:else}
		{@render children?.()}
	{/if}
</button>
