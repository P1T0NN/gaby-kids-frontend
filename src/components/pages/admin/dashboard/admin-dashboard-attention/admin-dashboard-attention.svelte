<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import AdminDashboardAttentionItem from './admin-dashboard-attention-item.svelte';

	// TYPES
	import type { DashboardAttentionItem } from '@/features/analytics/types/analyticsTypes.js';

	let { items }: { items: DashboardAttentionItem[] } = $props();
</script>

<Card.Root class="h-full">
	<Card.Header>
		<Card.Title>{m['AdminDashboardPage.AdminDashboardAttention.title']()}</Card.Title>
		<Card.Description>{m['AdminDashboardPage.AdminDashboardAttention.description']()}</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-col gap-1">
		{#each items as item (item.key)}
			<AdminDashboardAttentionItem {item} />
		{/each}
	</Card.Content>
</Card.Root>
