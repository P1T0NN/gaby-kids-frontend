// EMAILS
import { sendEmail } from '../../../emails/sendEmail.js';

// TEMPLATES
import { renderOrderCancelledCustomerTemplate } from '../../../emails/templates/orderCancelledCustomerTemplate.js';
import { renderOrderFulfilledCustomerTemplate } from '../../../emails/templates/orderFulfilledCustomerTemplate.js';

// TYPES
import type { EmailContext, OrderEmailData } from '../../../emails/types/emailTypes.js';

export async function sendOrderStatusEmail(
	ctx: EmailContext,
	order: OrderEmailData,
	status: 'cancelled' | 'fulfilled',
	eventAt: number
): Promise<void> {
	const template =
		status === 'fulfilled'
			? renderOrderFulfilledCustomerTemplate(order)
			: renderOrderCancelledCustomerTemplate(order);
	await sendEmail(ctx, {
		to: order.email,
		...template,
		idempotencyKey: `order-${status}:${order._id}:${eventAt}`
	});
}
