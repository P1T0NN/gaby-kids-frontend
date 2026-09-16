// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

type ExistingOrder = Pick<
	Doc<'orders'>,
	'stripePaymentIntentId' | 'receiptToken' | 'totalInCents' | 'currency'
>;

type ExpectedOrder = {
	stripePaymentIntentId: string;
	receiptToken: string;
	totalInCents: number;
	currency: string;
};

export function hasConflictingOrder(
	existingOrder: ExistingOrder | null,
	expectedOrder: ExpectedOrder
): boolean {
	return (
		!existingOrder ||
		existingOrder.stripePaymentIntentId !== expectedOrder.stripePaymentIntentId ||
		existingOrder.receiptToken !== expectedOrder.receiptToken ||
		existingOrder.totalInCents !== expectedOrder.totalInCents ||
		existingOrder.currency !== expectedOrder.currency
	);
}
