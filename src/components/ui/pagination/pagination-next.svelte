<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { buttonVariants } from "@/components/ui/button/index.js";
	import { cn } from "@/utils/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: PaginationPrimitive.NextButtonProps = $props();
</script>

<PaginationPrimitive.NextButton
	bind:ref
	aria-label="Go to next page"
	class={cn(buttonVariants({ variant: "ghost", size: "default" }), "pr-2!", className)}
	{...restProps}
>
	<span class="cn-pagination-next-text hidden sm:block">Next</span>
	<span class="icon-[lucide--chevron-right] size-4" data-icon="inline-end"></span>
</PaginationPrimitive.NextButton>
