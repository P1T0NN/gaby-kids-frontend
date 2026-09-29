<script lang="ts">
	// LIBRARIES
	import { onDestroy } from 'svelte';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Carousel from '@/components/ui/carousel/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { CarouselAPI } from '@/components/ui/carousel/context.js';

	type Props = {
		images: readonly string[];
		alt: string;
		class?: string;
	};

	let { images, alt, class: className }: Props = $props();

	let api = $state<CarouselAPI>();
	let activeIndex = $state(0);
	let thumbnails: HTMLDivElement | undefined = $state();
	let activeImage = $derived(images[activeIndex]);

	function selectImage(index: number): void {
		api?.scrollTo(index);
	}

	function setCarouselApi(nextApi: CarouselAPI | undefined): void {
		api?.off('select', updateActiveIndex);
		api = nextApi;
		if (!api) return;

		updateActiveIndex();
		api.on('select', updateActiveIndex);
	}

	function updateActiveIndex(): void {
		activeIndex = api?.selectedScrollSnap() ?? 0;
		scrollThumbnailIntoView(activeIndex);
	}

	function scrollThumbnailIntoView(index: number): void {
		const container = thumbnails;
		const thumbnail = container?.children[index];
		if (!container || !(thumbnail instanceof HTMLElement)) return;

		const containerRect = container.getBoundingClientRect();
		const thumbnailRect = thumbnail.getBoundingClientRect();
		// Center the active thumbnail; scrollTo clamps at the start and end of the strip.
		const target =
			container.scrollLeft +
			thumbnailRect.left -
			containerRect.left -
			(container.clientWidth - thumbnailRect.width) / 2;

		container.scrollTo({
			left: target,
			behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
		});
	}

	onDestroy(() => api?.off('select', updateActiveIndex));
</script>

<div class={cn('flex w-full flex-col gap-4', className)}>
	{#if activeImage}
		<Carousel.Root
			setApi={setCarouselApi}
			opts={{ loop: true }}
			class="w-full"
			aria-label={m['Components.ImageGallery.carouselLabel']()}
		>
			<Carousel.Content class="ms-0">
				{#each images as image, index (index)}
					<Carousel.Item class="ps-0" aria-hidden={index === activeIndex ? undefined : true}>
						<div
							class="relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted/20"
						>
							<img
								src={image}
								alt={index === activeIndex ? alt : ''}
								class="size-full object-contain"
								loading={index === 0 ? 'eager' : 'lazy'}
							/>
						</div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>

			{#if images.length > 1}
				<Button
					variant="secondary"
					size="icon"
					class="absolute inset-y-0 left-3 my-auto shadow-sm"
					onclick={() => api?.scrollPrev()}
					aria-label={m['Components.ImageGallery.previousImage']()}
				>
					<span class="icon-[lucide--chevron-left] size-4" aria-hidden="true"></span>
				</Button>

				<Button
					variant="secondary"
					size="icon"
					class="absolute inset-y-0 right-3 my-auto shadow-sm"
					onclick={() => api?.scrollNext()}
					aria-label={m['Components.ImageGallery.nextImage']()}
				>
					<span class="icon-[lucide--chevron-right] size-4" aria-hidden="true"></span>
				</Button>
			{/if}
		</Carousel.Root>

		{#if images.length > 1}
			<div
				bind:this={thumbnails}
				class="flex w-full [scrollbar-width:none] gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
				role="group"
				aria-label={m['Components.ImageGallery.thumbnailLabel']()}
			>
				{#each images as image, index (index)}
					<Button
						variant="ghost"
						size="icon"
						class={cn(
							'size-20 shrink-0 overflow-hidden rounded-lg border-2 p-0',
							index === activeIndex ? 'border-primary' : 'border-border'
						)}
						onclick={() => selectImage(index)}
						aria-label={m['Components.ImageGallery.selectImage']({ index: index + 1 })}
						aria-pressed={index === activeIndex}
					>
						<img src={image} alt="" class="size-full object-contain" loading="lazy" />
					</Button>
				{/each}
			</div>
		{/if}
	{:else}
		<div
			class="flex aspect-square w-full items-center justify-center rounded-2xl border bg-muted/20 text-sm text-muted-foreground"
		>
			{m['Components.ImageGallery.noImages']()}
		</div>
	{/if}
</div>
