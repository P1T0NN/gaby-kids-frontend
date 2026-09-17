<script lang="ts">
	// SVELTEKIT IMPORTS
	import { onDestroy, tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';

	// LIBRARIES
	import { useConvexClient, useMutation } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Toaster } from '@/components/ui/sonner/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import UpsellsDialogItem from './upsells-dialog-item.svelte';

	// HOOKS
	import { useAnalytics } from '@/features/analytics/hooks/useAnalytics.svelte.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';
	import type { Doc, Id } from '@convex/_generated/dataModel.js';

	type Upsell = FunctionReturnType<
		typeof api.tables.upsells.queries.fetchProductUpsells.fetchProductUpsells
	>[number];

	const titleId = $props.id();

	const client = useConvexClient();
	const analytics = useAnalytics();
	const trackUpsellEvent = useMutation(
		api.tables.upsells.mutations.trackUpsellEvent.trackUpsellEvent
	);

	let dialog: NativeDialog;
	let latestRequest = 0;
	let productName = $state('');
	let sourceProductId: Id<'products'> | undefined;
	let upsells = $state<Upsell[]>([]);
	let viewCartSelected = false;

	function openCart(): void {
		window.dispatchEvent(new Event('cart:open'));
	}

	function removeUpsell(id: Doc<'products'>['_id']): void {
		if (sourceProductId) {
			analytics.track(trackUpsellEvent, {
				event: 'product_added',
				sourceProductId,
				upsellProductId: id
			});
		}
		upsells = upsells.filter((upsell) => upsell._id !== id);
	}

	function handleClose(): void {
		if (!viewCartSelected && sourceProductId) {
			analytics.track(trackUpsellEvent, { event: 'dialog_dismissed', sourceProductId });
		}
		viewCartSelected = false;
	}

	export async function open(
		product: Pick<Doc<'products'>, '_id' | 'name'>,
		openCartIfEmpty: boolean
	): Promise<void> {
		const request = ++latestRequest;
		try {
			const result = await client.query(
				api.tables.upsells.queries.fetchProductUpsells.fetchProductUpsells,
				{ productId: product._id }
			);

			if (request !== latestRequest) return;

			if (result.length === 0) {
				if (openCartIfEmpty) openCart();
				return;
			}

			productName = product.name;
			sourceProductId = product._id;
			upsells = result;
			viewCartSelected = false;

			await tick();

			if (request === latestRequest) {
				dialog.open();
				analytics.track(trackUpsellEvent, {
					event: 'dialog_viewed',
					sourceProductId: product._id
				});
			}
		} catch {
			const shouldOpenCart = request === latestRequest && openCartIfEmpty;
			if (shouldOpenCart) openCart();
		}
	}

	onDestroy(() => latestRequest++);
</script>

<NativeDialog bind:this={dialog} aria-labelledby={titleId} onClose={handleClose} class="max-w-2xl">
	{#snippet children({ close })}
		<Toaster id="upsells-dialog" richColors position="bottom-right" />
		<div class="flex flex-col gap-5 p-5 sm:p-6">
			<header class="flex flex-col gap-2 pr-8">
				<div class="flex items-center gap-2 text-sm font-medium text-primary">
					<span class="icon-[lucide--circle-check] size-5" aria-hidden="true"></span>
					{m['UpsellsFeature.UpsellsDialog.title']()}
				</div>
				<h2 id={titleId} class="text-xl font-semibold tracking-tight">
					{m['UpsellsFeature.UpsellsDialog.heading']()}
				</h2>
				<p class="text-sm leading-6 text-muted-foreground">
					{m['UpsellsFeature.UpsellsDialog.description']({ name: productName })}
				</p>
			</header>

			{#if upsells.length > 0}
				<ul class="grid gap-3 sm:grid-cols-2">
					{#each upsells as upsell (upsell._id)}
						<li
							animate:flip={{ duration: prefersReducedMotion.current ? 0 : 180 }}
							out:fly={{ x: 24, duration: prefersReducedMotion.current ? 0 : 180 }}
						>
							<UpsellsDialogItem product={upsell} onAdded={() => removeUpsell(upsell._id)} />
						</li>
					{/each}
				</ul>
			{:else}
				<p class="flex items-center gap-2 text-sm text-muted-foreground" role="status">
					<span class="icon-[lucide--circle-check] size-4 text-primary" aria-hidden="true"></span>
					{m['UpsellsFeature.UpsellsDialog.allAdded']()}
				</p>
			{/if}

			<footer class="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
				<Button variant="outline" size="lg" onclick={close}>
					{m['UpsellsFeature.UpsellsDialog.keepShopping']()}
				</Button>
				<Button
					size="lg"
					onclick={() => {
						viewCartSelected = true;
						if (sourceProductId) {
							analytics.track(trackUpsellEvent, { event: 'view_cart_clicked', sourceProductId });
						}
						close();
						openCart();
					}}
				>
					{m['UpsellsFeature.UpsellsDialog.viewCart']()}
					<span class="icon-[lucide--arrow-right] size-4" data-icon="inline-end" aria-hidden="true"
					></span>
				</Button>
			</footer>
		</div>
	{/snippet}
</NativeDialog>
