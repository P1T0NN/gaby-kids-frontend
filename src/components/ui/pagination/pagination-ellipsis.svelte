<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "@/utils/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> = $props();
</script>

<span
	bind:this={ref}
	aria-hidden="true"
	data-slot="pagination-ellipsis"
	class={cn("size-9 items-center justify-center [&_svg:not([class*='size-'])]:size-4 flex items-center justify-center", className)}
	{...restProps}
>
	<span class="icon-[lucide--more-horizontal] size-4"></span>
	<span class="sr-only">More pages</span>
</span>
