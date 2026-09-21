<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	// LIBRARIES
	import { onMount } from 'svelte';
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '@/features/auth/lib/authClient';

	// COMPONENTS
	import { Toaster } from '@/components/ui/sonner/index.js';

	// HOOKS
	import { getCustomerIdLocal } from '@/features/analytics/hooks/useCustomerId.svelte.js';
	import { useCustomerLinks } from '@/features/customerLinks/hooks/useCustomerLinks.svelte.js';

	let { children, data } = $props();

	createSvelteAuthClient({
		authClient,
		getServerState: () => data.authState
	});

	useCustomerLinks();

	onMount(() => {
		getCustomerIdLocal();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{@render children()}
<Toaster richColors />
