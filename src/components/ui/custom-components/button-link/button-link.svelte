<script lang="ts">
	// UTILS
	import { localizeHref } from '@/utils/localizeHref.js';

	// COMPONENTS
	import { Button, type ButtonProps } from '@/components/ui/button/index.js';

	type Props = Omit<ButtonProps, 'href'> & { href: string };

	let { href, ...restProps }: Props = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Button 
	href={localizeHref(href)} 
	{...restProps} 
/>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
