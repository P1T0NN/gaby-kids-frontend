<script lang="ts">
	// SVELTEKIT IMPORTS
	import { asset } from '$app/paths';

	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	let { categoryId }: { categoryId: Doc<'products'>['categoryId'] } = $props();
	const titleId = $props.id();
	let opened = $state(false);
	const categories = useQuery(
		api.tables.categories.queries.fetchCategoryOptions.fetchCategoryOptions,
		{}
	);
	const categorySlug = $derived(
		categories.data?.find((category) => category._id === categoryId)?.slug
	);
	const guides = [
		{
			slug: 'guayaberas',
			src: '/categories/tabla-guayaberas.png',
			width: 971,
			height: 768,
			rows: [
				[0, 25.5, 35.5, 37, 43],
				[1, 27.5, 37.5, 40, 47],
				[2, 28, 39.5, 41, 53.5],
				[3, 29, 41.5, 43, 58],
				[4, 30.5, 43.5, 45, 60],
				[5, 31.5, 45, 47, 62],
				[6, 32.5, 48.5, 48, 67],
				[8, 34, 50.5, 50, 74],
				[10, 35.5, 52.5, 55, 80],
				[12, 37, 55, 58, 87],
				[14, 40.5, 58, 60, 97],
				[16, 41.5, 61, 64, 104.5]
			]
		},
		{
			slug: 'trajes-tipicos',
			src: '/categories/tabla-trajes-tipicos.png',
			width: 1953,
			height: 1381,
			rows: [
				[0, 25, 24, 25, 44.5],
				[1, 26, 26, 26, 47],
				[2, 27, 28, 27, 52],
				[3, 28.5, 29, 28, 55],
				[4, 30.5, 30.5, 30, 60],
				[5, 34, 34, 31, 64],
				[6, 34.5, 37, 32, 68]
			]
		}
	];
	const guide = $derived(guides.find((guide) => guide.slug === categorySlug));
	const isGuayabera = $derived(categorySlug === 'guayaberas');
	const headings = $derived([
		isGuayabera
			? m['ProductPage.ProductSizeGuide.size']()
			: m['ProductPage.ProductSizeGuide.ageSize'](),
		m['ProductPage.ProductSizeGuide.backWidth'](),
		isGuayabera
			? m['ProductPage.ProductSizeGuide.backLength']()
			: m['ProductPage.ProductSizeGuide.sleeveLength'](),
		isGuayabera
			? m['ProductPage.ProductSizeGuide.pantsCircumference']()
			: m['ProductPage.ProductSizeGuide.pantsWidth'](),
		m['ProductPage.ProductSizeGuide.pantsLength']()
	]);
</script>

{#if guide}
	<NativeDialog aria-labelledby={titleId} class="max-w-[min(64rem,calc(100dvw-2rem))]">
		{#snippet trigger({ open })}
			<Button
				variant="link"
				class="min-h-11 w-fit justify-start gap-2 px-0 underline"
				aria-haspopup="dialog"
				onclick={() => {
					opened = true;
					open();
				}}
			>
				<span class="icon-[lucide--ruler] size-4" aria-hidden="true"></span>
				{m['ProductPage.ProductSizeGuide.title']()}
			</Button>
		{/snippet}
		{#snippet children({ close })}
			<div class="flex flex-col gap-5 p-5 sm:p-8">
				<header class="flex flex-col gap-2 pe-8">
					<h2 id={titleId} class="text-xl font-semibold">
						{m['ProductPage.ProductSizeGuide.title']()}
					</h2>
					<p class="text-sm text-muted-foreground">
						{m['ProductPage.ProductSizeGuide.description']()}
					</p>
				</header>
				{#if opened}
					<StaticImage
						src={guide.src}
						alt={isGuayabera
							? m['ProductPage.ProductSizeGuide.guayaberasAlt']()
							: m['ProductPage.ProductSizeGuide.trajesAlt']()}
						width={guide.width}
						height={guide.height}
						class="h-auto w-full rounded-lg border"
					/>
				{/if}
				<a
					href={asset(guide.src)}
					target="_blank"
					rel="noopener"
					class="inline-flex min-h-11 w-fit items-center gap-2 rounded-sm text-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
				>
					<span class="icon-[lucide--zoom-in] size-4" aria-hidden="true"></span>
					{m['ProductPage.ProductSizeGuide.fullSize']()}
				</a>
				<details class="rounded-lg border p-4">
					<summary
						class="min-h-11 cursor-pointer content-center text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
						>{m['ProductPage.ProductSizeGuide.textVersion']()}</summary
					>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll the measurement table.) -->
					<div
						class="overflow-x-auto"
						tabindex="0"
						role="region"
						aria-label={m['ProductPage.ProductSizeGuide.textVersion']()}
					>
						<table class="w-full text-left text-sm">
							<caption class="py-3 text-start text-muted-foreground"
								>{m['ProductPage.ProductSizeGuide.centimeters']()}</caption
							>
							<thead
								><tr
									>{#each headings as heading (heading)}<th
											scope="col"
											class="border-b px-3 py-2 font-medium">{heading}</th
										>{/each}</tr
								></thead
							>
							<tbody
								>{#each guide.rows as row (row[0])}<tr
										><th scope="row" class="border-b px-3 py-2 font-medium">{row[0]}</th
										>{#each row.slice(1) as value, index (index)}<td
												class="border-b px-3 py-2 tabular-nums">{value}</td
											>{/each}</tr
									>{/each}</tbody
							>
						</table>
					</div>
					{#if !isGuayabera}
						<p class="mt-4 text-sm leading-relaxed">
							{m['ProductPage.ProductSizeGuide.hatInstructions']()}
						</p>
					{/if}
				</details>
				<Button variant="outline" class="min-h-11 self-end" onclick={close}
					>{m['Components.NativeDialog.close']()}</Button
				>
			</div>
		{/snippet}
	</NativeDialog>
{/if}
