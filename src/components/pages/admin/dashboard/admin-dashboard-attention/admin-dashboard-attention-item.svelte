<script lang="ts">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// TYPES
	import type { DashboardAttentionItem } from '@/features/analytics/types/analyticsTypes.js';

	let { item }: { item: DashboardAttentionItem } = $props();
</script>

<Link
	href={item.href}
	class="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
>
	<span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
		<span class={item.iconClass} aria-hidden="true"></span>
	</span>
	<span class="flex min-w-0 flex-1 flex-col">
		<span class="text-sm font-medium">{item.label}</span>
		<span class="truncate text-xs text-muted-foreground">{item.hint}</span>
	</span>
	<Badge variant={item.variant}>{item.count}</Badge>
	<span
		class="icon-[lucide--chevron-right] size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
		aria-hidden="true"
	></span>
</Link>
