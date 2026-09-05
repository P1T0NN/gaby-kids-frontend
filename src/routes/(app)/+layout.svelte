<script lang="ts">
	// COMPONENTS
	import Header from '@/components/ui/custom-components/header/header.svelte';

	let { children } = $props();
</script>

<Header />
{@render children()}
