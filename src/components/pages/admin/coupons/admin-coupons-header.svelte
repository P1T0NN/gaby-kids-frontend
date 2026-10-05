<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AddCouponDialog from '@/features/coupons/components/add-coupon-dialog/add-coupon-dialog.svelte';
</script>

<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
	<div class="flex flex-col gap-1">
		<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
			{m['AdminCouponsPage.AdminCouponsHeader.adminLabel']()}
		</p>

		<h1 class="text-2xl font-semibold tracking-tight">
			{m['AdminCouponsPage.AdminCouponsHeader.title']()}
		</h1>

		<p class="max-w-prose text-sm text-muted-foreground">
			{m['AdminCouponsPage.AdminCouponsHeader.description']()}
		</p>
	</div>

	<AddCouponDialog />
</header>
