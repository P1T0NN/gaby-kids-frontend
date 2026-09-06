<script lang="ts">
	// UTILS
	import { localizeHref } from '@/utils/localizeHref.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = Omit<HTMLAnchorAttributes, 'children' | 'href'> & {
		href: string;
		children: Snippet;
	};

	let { href, children, ...restProps }: Props = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a href={localizeHref(href)} {...restProps}>
	{@render children()}
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
