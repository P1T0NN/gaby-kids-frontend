<script lang="ts">
	import './layout.css';

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

<svelte:head><link rel="icon" href="/logo/opt/logo-2d-transparent-569w.webp" /></svelte:head>

{@render children()}
<Toaster richColors />
