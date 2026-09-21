// LIBRARIES
import { onMount } from 'svelte';
import { api } from '@convex/_generated/api';
import { useMutation } from 'convex-svelte';

// HOOKS
import { getCustomerIdLocal } from '@/features/analytics/hooks/useCustomerId.svelte.js';
import { authClient } from '@/features/auth/lib/authClient';

/**
 * Reconciles the signed-in account with past orders: orders tagged with this device's anonymous
 * local id follow the account, and orders placed with the account's verified email come to it even
 * when another account is holding them. Runs once per signed-in user per page load; idempotent.
 */
export function useCustomerLinks() {
	const claim = useMutation(
		api.tables.customerLinks.mutations.claimCustomerOrders.claimCustomerOrders
	);
	const session = authClient.useSession();
	let claimedFor: string | undefined;

	onMount(() => {
		return session.listen((state) => {
			const userId = state.data?.user.id;

			if (!userId) {
				claimedFor = undefined;
				return;
			}
			if (userId === claimedFor) return;

			claimedFor = userId;
			void claim({ localCustomerId: getCustomerIdLocal() }).catch(() => undefined);
		});
	});
}
