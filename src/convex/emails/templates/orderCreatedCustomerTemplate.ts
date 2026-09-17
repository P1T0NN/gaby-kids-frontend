// UTILS
import { escapeHtml } from '../../../shared/utils/escapeHtml.js';
import { orderEmailParts } from '../helpers/orderEmailParts.js';

// DATA
import { EMAIL_DATA } from '../data/emailData.js';

// TYPES
import type { OrderEmailData, OrderItemEmailData, SendEmailOptions } from '../types/emailTypes.js';

export function renderOrderCreatedCustomerTemplate(
	order: OrderEmailData,
	items: OrderItemEmailData[]
): Omit<SendEmailOptions, 'to' | 'idempotencyKey'> {
	const { COLORS } = EMAIL_DATA;

	const orderUrl = new URL('/checkout/success', EMAIL_DATA.BRAND.URL);
	orderUrl.searchParams.set('key', order.receiptToken);

	const { total, lines, itemRows } = orderEmailParts(order, items);

	return {
		subject: `Order ${order.code} received`,
		previewText: `We received your order ${order.code}.`,
		text: `Hi ${order.firstName},\n\nWe received your order ${order.code}.\n\n${lines}\n\nTotal: ${total}\n\nView order: ${orderUrl}`,
		content: `
			<h1 style="margin:0 0 16px;font-size:28px;line-height:36px;color:${COLORS.FOREGROUND};">Order received</h1>
			<p style="margin:0 0 16px;color:${COLORS.MUTED_FOREGROUND};">Hi ${escapeHtml(order.firstName)}, we received order <strong>${escapeHtml(order.code)}</strong>.</p>
			<ul style="margin:0 0 16px;padding-left:20px;color:${COLORS.FOREGROUND};">${itemRows}</ul>
			<p style="margin:0 0 24px;font-size:18px;"><strong>Total: ${escapeHtml(total)}</strong></p>
			<a href="${escapeHtml(orderUrl.toString())}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:${COLORS.PRIMARY};color:${COLORS.PRIMARY_FOREGROUND};text-decoration:none;">View order</a>
		`
	};
}
