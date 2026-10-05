<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { COUPONS_CONFIG } from '@/shared/features/coupons/config.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// HOOKS
	import { getCustomerIdLocal } from '@/features/analytics/hooks/useCustomerId.svelte.js';

	// UTILS
	import { normalizeCouponCode } from '@/shared/features/coupons/utils/normalizeCouponCode.js';
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { AppliedCoupon } from '@/shared/features/coupons/types/couponTypes.js';

	type Props = {
		subtotalInCents: number;
		/** Current checkout email, so one-per-customer codes reject before payment. */
		email?: string;
		applied?: AppliedCoupon | null;
	};

	let {
		subtotalInCents,
		email = '',
		applied = $bindable<AppliedCoupon | null>(null)
	}: Props = $props();

	let code = $state('');
	let checking = $state(false);

	const client = useConvexClient();
	const authenticated = $derived(page.data.authState.isAuthenticated);
	const requiresSignIn = $derived(COUPONS_CONFIG.COUPONS_REQUIRE_SIGN_IN && !authenticated);

	async function applyCoupon(): Promise<void> {
		const normalized = normalizeCouponCode(code);
		if (!normalized || checking) return;

		checking = true;
		try {
			// Preview only: the order reservation re-validates and prices the coupon.
			const result = await client.query(api.tables.coupons.queries.validateCoupon.validateCoupon, {
				code: normalized,
				subtotalInCents,
				customerRef: getCustomerIdLocal(),
				email: email.trim() || undefined
			});

			applied = { code: result.code, percentOff: result.percentOff };

			code = '';

			toastMessage({
				type: 'success',
				message: m['CouponsFeature.CheckoutCoupon.applied']({ code: result.code })
			});
		} catch (error) {
			applied = null;
			toastMessage({
				type: 'error',
				error,
				message: m['CouponsFeature.CheckoutCoupon.error']()
			});
		} finally {
			checking = false;
		}
	}
</script>

{#if applied}
	<div
		class="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
	>
		<span class="flex min-w-0 items-center gap-2 font-medium">
			<span class="icon-[lucide--ticket-percent] size-4 shrink-0" aria-hidden="true"></span>

			<span class="truncate">
				{m['CouponsFeature.CheckoutCoupon.applied']({ code: applied.code })}
			</span>
		</span>

		<Button
			type="button"
			variant="ghost"
			size="icon"
			onclick={() => (applied = null)}
			aria-label={m['CouponsFeature.CheckoutCoupon.remove']({ code: applied.code })}
		>
			<span class="icon-[lucide--x] size-4" aria-hidden="true"></span>
		</Button>
	</div>
{:else if requiresSignIn}
	<div class="flex flex-col items-start gap-3 rounded-lg border bg-muted/50 p-3 text-sm">
		<span class="flex items-center gap-2 text-muted-foreground">
			<span class="icon-[lucide--ticket-percent] size-4 shrink-0" aria-hidden="true"></span>
			{m['CouponsFeature.CheckoutCoupon.signInRequired']()}
		</span>

		<ButtonLink href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN} variant="outline" size="sm">
			{m['CouponsFeature.CheckoutCoupon.signIn']()}
		</ButtonLink>
	</div>
{:else}
	<div class="flex flex-col gap-2">
		<label class="text-sm font-medium" for="coupon-code">
			{m['CouponsFeature.CheckoutCoupon.label']()}
		</label>

		<div class="flex gap-2">
			<Input
				id="coupon-code"
				bind:value={code}
				placeholder={m['CouponsFeature.CheckoutCoupon.placeholder']()}
				autocomplete="off"
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						void applyCoupon();
					}
				}}
			/>

			<Button
				type="button"
				variant="outline"
				onclick={() => void applyCoupon()}
				disabled={checking || !code.trim()}
			>
				{#if checking}
					<Spinner data-icon="inline-start" />
				{/if}

				{checking
					? m['CouponsFeature.CheckoutCoupon.applying']()
					: m['CouponsFeature.CheckoutCoupon.apply']()}
			</Button>
		</div>
	</div>
{/if}
