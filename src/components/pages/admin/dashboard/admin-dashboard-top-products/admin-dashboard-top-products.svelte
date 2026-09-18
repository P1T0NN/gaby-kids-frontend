<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import * as Table from '@/components/ui/table/index.js';
	import AdminDashboardTopProductsItem from './admin-dashboard-top-products-item.svelte';

	// TYPES
	import type { DashboardTopProduct } from '@/features/analytics/types/analyticsTypes.js';

	let {
		products,
		rangeLabel
	}: {
		products: DashboardTopProduct[];
		rangeLabel: string;
	} = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{m['AdminDashboardPage.AdminDashboardTopProducts.title']()}</Card.Title>
		<Card.Description>
			{m['AdminDashboardPage.AdminDashboardTopProducts.description']({ range: rangeLabel })}
		</Card.Description>
	</Card.Header>
	<Card.Content class="px-0">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-12 ps-6">
						<span class="sr-only">{m['AdminDashboardPage.AdminDashboardTopProducts.rankColumn']()}</span>
					</Table.Head>
					<Table.Head>{m['AdminDashboardPage.AdminDashboardTopProducts.productColumn']()}</Table.Head>
					<Table.Head class="text-end">{m['AdminDashboardPage.AdminDashboardTopProducts.unitsColumn']()}</Table.Head>
					<Table.Head class="text-end">
						{m['AdminDashboardPage.AdminDashboardTopProducts.revenueColumn']()}
					</Table.Head>
					<Table.Head class="hidden w-48 pe-6 md:table-cell">
						{m['AdminDashboardPage.AdminDashboardTopProducts.shareColumn']()}
					</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if products.length === 0}
					<Table.Row>
						<Table.Cell colspan={5} class="px-6 py-8 text-center text-sm text-muted-foreground">
							{m['AdminDashboardPage.AdminDashboardTopProducts.empty']()}
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each products as product, index (product.productId)}
						<AdminDashboardTopProductsItem {product} {index} />
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Root>
