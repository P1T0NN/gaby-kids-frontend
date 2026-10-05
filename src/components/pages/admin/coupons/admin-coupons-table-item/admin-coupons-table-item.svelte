<script lang="ts">
	// LIBRARIES
	import { getLocale } from '@/lib/paraglide/runtime';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AdminCouponsTableItemDelete from './admin-coupons-table-item-delete.svelte';
	import AdminCouponsTableItemStatusButton from './admin-coupons-table-item-status-button.svelte';
	import { Badge, type BadgeVariant } from '@/components/ui/badge/index.js';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import { TableCell } from '@/components/ui/table/index.js';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	type Coupon = Doc<'coupons'>;

	let { coupon }: { coupon: Coupon } = $props();

	const expiresAt = $derived(coupon.expiresAt);
	const isExpired = $derived(expiresAt !== undefined && Date.now() > expiresAt);
	const status = $derived(!coupon.active ? 'disabled' : isExpired ? 'expired' : 'active');
	const statusVariant = $derived<BadgeVariant>(
		status === 'active' ? 'default' : status === 'expired' ? 'destructive' : 'secondary'
	);
	const statusLabel = $derived(
		status === 'active'
			? m['AdminCouponsPage.AdminCouponsTableItem.active']()
			: status === 'expired'
				? m['AdminCouponsPage.AdminCouponsTableItem.expired']()
				: m['AdminCouponsPage.AdminCouponsTableItem.disabled']()
	);
	const redemptionsLabel = $derived(
		coupon.maxRedemptions !== undefined
			? m['AdminCouponsPage.AdminCouponsTableItem.usedOfLimit']({
					count: coupon.redemptionCount,
					limit: coupon.maxRedemptions
				})
			: m['AdminCouponsPage.AdminCouponsTableItem.used']({ count: coupon.redemptionCount })
	);
</script>

{#snippet actionsTrigger()}
	<span class="icon-[lucide--ellipsis] size-4" aria-hidden="true"></span>
{/snippet}

<TableCell>
	<p class="truncate font-medium">{coupon.name}</p>
</TableCell>
<TableCell class="font-mono text-xs whitespace-nowrap">{coupon.code}</TableCell>
<TableCell class="text-sm whitespace-nowrap tabular-nums">
	{m['AdminCouponsPage.AdminCouponsTableItem.percentOff']({ percent: coupon.percentOff })}
</TableCell>
<TableCell>
	<Badge variant={statusVariant}>{statusLabel}</Badge>
</TableCell>
<TableCell class="text-sm whitespace-nowrap text-muted-foreground">
	{expiresAt !== undefined
		? formatDate(expiresAt, getLocale())
		: m['AdminCouponsPage.AdminCouponsTableItem.noExpiry']()}
</TableCell>
<TableCell class="text-sm whitespace-nowrap tabular-nums">{redemptionsLabel}</TableCell>
<TableCell class="text-right">
	<NativePopover
		id={`coupon-actions-${coupon._id}`}
		trigger={actionsTrigger}
		triggerLabel={m['AdminCouponsPage.AdminCouponsTableItem.openActions']({ code: coupon.code })}
		triggerClass="size-8 justify-center hover:bg-muted [&_svg]:size-4"
		class="min-w-44"
	>
		<AdminCouponsTableItemStatusButton couponId={coupon._id} active={coupon.active} />
		<AdminCouponsTableItemDelete couponId={coupon._id} couponCode={coupon.code} />
	</NativePopover>
</TableCell>
