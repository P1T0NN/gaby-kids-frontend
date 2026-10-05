// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// CONFIG
import { COUPONS_CONFIG } from '@/shared/features/coupons/config.js';

// TYPES
import type { Snippet } from 'svelte';
import type {
	CustomFieldContext,
	FieldConfig
} from '@/components/ui/custom-components/form/formTypes.js';

export function createCouponFields(expiryField: Snippet<[CustomFieldContext]>): FieldConfig[] {
	return [
		{
			kind: 'input',
			name: 'name',
			label: m['CouponsFeature.AddCouponDialog.name'](),
			placeholder: m['CouponsFeature.AddCouponDialog.namePlaceholder'](),
			type: 'text',
			required: true,
			maxLength: COUPONS_CONFIG.maxNameLength
		},
		{
			kind: 'input',
			name: 'code',
			label: m['CouponsFeature.AddCouponDialog.code'](),
			description: m['CouponsFeature.AddCouponDialog.codeHint'](),
			placeholder: m['CouponsFeature.AddCouponDialog.codePlaceholder'](),
			type: 'text',
			required: true,
			maxLength: COUPONS_CONFIG.maxCodeLength
		},
		{
			kind: 'input',
			name: 'percentOff',
			label: m['CouponsFeature.AddCouponDialog.percentOff'](),
			description: m['CouponsFeature.AddCouponDialog.percentOffHint'](),
			type: 'number',
			required: true,
			min: COUPONS_CONFIG.minPercentOff,
			max: COUPONS_CONFIG.maxPercentOff,
			step: 1,
			placeholder: '10'
		},
		{
			kind: 'input',
			name: 'minSubtotalInCents',
			label: m['CouponsFeature.AddCouponDialog.minSubtotal'](),
			description: m['CouponsFeature.AddCouponDialog.minSubtotalHint'](),
			type: 'number',
			min: 0,
			step: 0.01,
			placeholder: '0.00'
		},
		{
			kind: 'input',
			name: 'maxRedemptions',
			label: m['CouponsFeature.AddCouponDialog.maxRedemptions'](),
			description: m['CouponsFeature.AddCouponDialog.maxRedemptionsHint'](),
			type: 'number',
			min: 1,
			step: 1,
			placeholder: '100'
		},
		{
			kind: 'custom',
			name: 'expiresAt',
			label: m['CouponsFeature.AddCouponDialog.expiresAt'](),
			description: m['CouponsFeature.AddCouponDialog.expiresAtHint'](),
			render: expiryField
		},
		{
			kind: 'switch',
			name: 'onePerCustomer',
			label: m['CouponsFeature.AddCouponDialog.onePerCustomer'](),
			description: m['CouponsFeature.AddCouponDialog.onePerCustomerHint']()
		},
		{
			kind: 'switch',
			name: 'active',
			label: m['CouponsFeature.AddCouponDialog.active'](),
			description: m['CouponsFeature.AddCouponDialog.activeHint']()
		}
	];
}
