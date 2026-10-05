<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AddCouponDialogExpiryField from './add-coupon-dialog-expiry-field.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// UTILS
	import { createCouponFields } from '@/features/coupons/forms/createCouponFields.js';

	// SCHEMAS
	import { saveCouponSchema } from '@/shared/features/coupons/schemas/couponSchemas.js';

	// TYPES
	import type {
		CustomFieldContext,
		MutationValues
	} from '@/components/ui/custom-components/form/formTypes.js';

	type SaveCouponMutation = typeof api.tables.coupons.mutations.saveCoupon.saveCoupon;

	let { close }: { close: () => void } = $props();

	let values = $state<MutationValues<SaveCouponMutation>>({
		active: true,
		onePerCustomer: false
	});

	let submitting = $state(false);
</script>

{#snippet expiryField({ field, inputValue, setValue, disabled }: CustomFieldContext)}
	<AddCouponDialogExpiryField
		value={inputValue(field.name)}
		onValueChange={(value) => setValue(field.name, value)}
		{disabled}
	/>
{/snippet}

<div class="flex flex-col gap-5 p-6">
	<div class="flex flex-col gap-1.5">
		<h2 class="pr-8 text-lg font-semibold">
			{m['CouponsFeature.AddCouponDialog.title']()}
		</h2>

		<p class="text-sm text-muted-foreground">
			{m['CouponsFeature.AddCouponDialog.description']()}
		</p>
	</div>

	<Form
		id="add-coupon-form"
		function={api.tables.coupons.mutations.saveCoupon.saveCoupon}
		fields={createCouponFields(expiryField)}
		schema={saveCouponSchema}
		bind:values
		bind:submitting
		resetOnSuccess={false}
		onSuccess={() => close()}
		successMessage={m['CouponsFeature.AddCouponDialog.couponCreated']()}
		errorMessage={m['CouponsFeature.AddCouponDialog.createError']()}
	/>

	<div class="flex justify-end gap-2">
		<Button type="button" variant="outline" onclick={close} disabled={submitting}>
			{m['CouponsFeature.AddCouponDialog.cancel']()}
		</Button>

		<Button type="submit" form="add-coupon-form" disabled={submitting}>
			{#if submitting}
				<Spinner data-icon="inline-start" />
			{/if}

			{submitting
				? m['CouponsFeature.AddCouponDialog.creating']()
				: m['CouponsFeature.AddCouponDialog.create']()}
		</Button>
	</div>
</div>
