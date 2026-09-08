// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';

// EMAILS
import { sendEmail } from '../../../emails/sendEmail.js';

// TEMPLATES
import { renderOrderCreatedAdminTemplate } from '../../../emails/templates/orderCreatedAdminTemplate.js';
import { renderOrderCreatedCustomerTemplate } from '../../../emails/templates/orderCreatedCustomerTemplate.js';

// TYPES
import type {
	EmailContext,
	OrderEmailData,
	OrderItemEmailData
} from '../../../emails/types/emailTypes.js';

export async function sendOrderCreatedEmails(
	ctx: EmailContext,
	order: OrderEmailData,
	items: OrderItemEmailData[]
): Promise<void> {
	await sendEmail(ctx, {
		to: order.email,
		...renderOrderCreatedCustomerTemplate(order, items),
		idempotencyKey: `order-created-customer:${order._id}`
	});
	await sendEmail(ctx, {
		to: COMPANY_DATA.EMAIL,
		...renderOrderCreatedAdminTemplate(order, items),
		idempotencyKey: `order-created-admin:${order._id}`
	});
}
