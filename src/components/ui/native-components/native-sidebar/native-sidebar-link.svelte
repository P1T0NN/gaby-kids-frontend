<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';
	import { usePathname } from '@/hooks/usePathname.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = Omit<HTMLAnchorAttributes, 'children' | 'class' | 'href'> & {
		href: string;
		exact?: boolean;
		class?: string;
		children: Snippet;
	};

	let { href, exact = false, class: className, children, ...restProps }: Props = $props();

	const pathname = usePathname();
	const isActive = $derived(pathname.isActive(href, exact));
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Link
	{href}
	{...restProps}
	aria-current={isActive ? 'page' : undefined}
	data-active={isActive}
	data-native-sidebar-link
	class={cn(
		'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring/40 [&_svg]:size-[18px]',
		isActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
		className
	)}
>
	{@render children()}
</Link>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
