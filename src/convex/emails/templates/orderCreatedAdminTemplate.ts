// UTILS
import { escapeHtml } from '../../../shared/utils/escapeHtml.js';
import { formatPrice } from '../../../shared/utils/pricing.js';

// DATA
import { EMAIL_DATA } from '../data/emailData.js';

// TYPES
import type { OrderEmailData, OrderItemEmailData, SendEmailOptions } from '../types/emailTypes.js';

export function renderOrderCreatedAdminTemplate(
	order: OrderEmailData,
	items: OrderItemEmailData[]
): Omit<SendEmailOptions, 'to' | 'idempotencyKey'> {
	const { COLORS } = EMAIL_DATA;

	const total = formatPrice(order.totalInCents, order.currency, 'en');
	const adminUrl = new URL(`/admin/orders/edit-order/${order._id}`, EMAIL_DATA.BRAND.URL);

	const lines = items.map((item) => `${item.quantity} x ${item.name}`).join('\n');
	const itemRows = items
		.map((item) => `<li style="margin:0 0 8px;">${item.quantity} x ${escapeHtml(item.name)}</li>`)
		.join('');

	return {
		subject: `New order ${order.code}`,
		previewText: `${order.firstName} ${order.lastName} submitted order ${order.code}.`,
		text: `New order ${order.code}\n\nCustomer: ${order.firstName} ${order.lastName} (${order.email})\nFulfillment: ${order.fulfillmentMethod}\n\n${lines}\n\nTotal: ${total}\n\nOpen order: ${adminUrl}`,
		content: `
			<h1 style="margin:0 0 16px;font-size:28px;line-height:36px;color:${COLORS.FOREGROUND};">New order ${escapeHtml(order.code)}</h1>
			<p style="margin:0 0 8px;"><strong>Customer:</strong> ${escapeHtml(order.firstName)} ${escapeHtml(order.lastName)} (${escapeHtml(order.email)})</p>
			<p style="margin:0 0 8px;"><strong>Fulfillment:</strong> ${escapeHtml(order.fulfillmentMethod)}</p>
			<ul style="margin:16px 0;padding-left:20px;color:${COLORS.FOREGROUND};">${itemRows}</ul>
			<p style="margin:0 0 24px;"><strong>Total:</strong> ${escapeHtml(total)}</p>
			<a href="${escapeHtml(adminUrl.toString())}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:${COLORS.PRIMARY};color:${COLORS.PRIMARY_FOREGROUND};text-decoration:none;">Open order</a>
		`
	};
}
