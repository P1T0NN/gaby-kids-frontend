<script lang="ts">
	import { m } from '@/lib/paraglide/messages';

	let { total }: { total: string } = $props();
</script>

<div class="flex flex-col gap-3 border-t pt-4">
	<div class="flex items-center justify-between font-medium">
		<span>{m['CartFeature.Cart.total']()}</span>
		<span>{total}</span>
	</div>
</div>
