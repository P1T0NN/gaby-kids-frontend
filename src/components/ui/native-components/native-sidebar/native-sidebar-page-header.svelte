<script lang="ts">
	// COMPONENTS
	import BreadcrumbDisplay from '@/components/ui/custom-components/breadcrumb-display/breadcrumb-display.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { m } from '@/lib/paraglide/messages';

	type Props = {
		title?: string;
		pageName?: string;
		rootHref?: string;
		onOpenSidebar?: () => void;
		sidebarLabel?: string;
	};

	let {
		title = m['Components.NativeSidebarPageHeader.title'](),
		pageName,
		rootHref,
		onOpenSidebar,
		sidebarLabel = m['Components.NativeSidebarPageHeader.openNavigation']()
	}: Props = $props();
</script>

<header class="flex h-14 shrink-0 items-center border-b px-4">
	<div class="flex min-w-0 items-center gap-2">
		{#if onOpenSidebar}
			<Button
				variant="ghost"
				size="icon-sm"
				class="md:hidden"
				type="button"
				aria-label={sidebarLabel}
				onclick={onOpenSidebar}
			>
				<span class="icon-[lucide--panel-left] size-4" aria-hidden="true"></span>
			</Button>
		{/if}

		<BreadcrumbDisplay {title} {pageName} {rootHref} />
	</div>
</header>
