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
	data-slot="breadcrumb-ellipsis"
	role="presentation"
	aria-hidden="true"
	class={cn("size-5 [&>svg]:size-4 flex items-center justify-center", className)}
	{...restProps}
>
	<span class="icon-[lucide--more-horizontal] size-4"></span>
	<span class="sr-only">More</span>
</span>
