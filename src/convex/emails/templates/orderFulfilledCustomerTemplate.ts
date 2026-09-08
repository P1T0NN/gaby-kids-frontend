// UTILS
import { escapeHtml } from '../../../shared/utils/escapeHtml.js';

// DATA
import { EMAIL_DATA } from '../data/emailData.js';

// TYPES
import type { OrderEmailData, SendEmailOptions } from '../types/emailTypes.js';

export function renderOrderFulfilledCustomerTemplate(
	order: OrderEmailData
): Omit<SendEmailOptions, 'to' | 'idempotencyKey'> {
	const { COLORS } = EMAIL_DATA;

	const orderUrl = new URL('/checkout/success', EMAIL_DATA.BRAND.URL);
	orderUrl.searchParams.set('key', order.retryKey);

	const message =
		order.fulfillmentMethod === 'pickup'
			? 'Your order has been marked fulfilled and is ready for pickup.'
			: 'Your order has been marked fulfilled.';

	return {
		subject: `Order ${order.code} fulfilled`,
		previewText: message,
		text: `${message}\n\nView order: ${orderUrl}`,
		content: `
			<h1 style="margin:0 0 16px;font-size:28px;line-height:36px;color:${COLORS.FOREGROUND};">Order fulfilled</h1>
			<p style="margin:0 0 24px;color:${COLORS.MUTED_FOREGROUND};">${message}</p>
			<a href="${escapeHtml(orderUrl.toString())}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:${COLORS.PRIMARY};color:${COLORS.PRIMARY_FOREGROUND};text-decoration:none;">View order ${escapeHtml(order.code)}</a>
		`
	};
}
