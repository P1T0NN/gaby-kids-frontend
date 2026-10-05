<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// LIBRARIES
	import { useMutation } from 'convex-svelte';

	// COMPONENTS
	import ConfirmDeleteDialog from '@/components/ui/custom-components/confirm-delete-dialog/confirm-delete-dialog.svelte';
	import DestructiveMenuItem from '@/components/ui/custom-components/destructive-menu-item/destructive-menu-item.svelte';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel.js';

	let { couponId, couponCode }: { couponId: Id<'coupons'>; couponCode: string } = $props();

	let pending = $state(false);
	const deleteCoupon = useMutation(api.tables.coupons.mutations.deleteCoupon.deleteCoupon);

	async function handleDelete(close: () => void): Promise<void> {
		if (pending) return;

		pending = true;
		try {
			await deleteCoupon({ couponId });
			toastMessage({
				type: 'success',
				message: m['AdminCouponsPage.AdminCouponsTableItemDelete.couponDeleted']()
			});
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: m['AdminCouponsPage.AdminCouponsTableItemDelete.deleteError']()
			});
		} finally {
			pending = false;
			close();
		}
	}
</script>

<ConfirmDeleteDialog
	title={m['AdminCouponsPage.AdminCouponsTableItemDelete.deleteConfirmationTitle']()}
	description={m['AdminCouponsPage.AdminCouponsTableItemDelete.deleteConfirmationDescription']({
		code: couponCode
	})}
	confirmLabel={m['AdminCouponsPage.AdminCouponsTableItemDelete.deleteCoupon']()}
	cancelLabel={m['AdminCouponsPage.AdminCouponsTableItemDelete.cancel']()}
	{pending}
	onConfirm={(close) => void handleDelete(close)}
>
	{#snippet trigger({ open })}
		<DestructiveMenuItem
			label={m['AdminCouponsPage.AdminCouponsTableItemDelete.deleteCoupon']()}
			disabled={pending}
			onclick={open}
		/>
	{/snippet}
</ConfirmDeleteDialog>
