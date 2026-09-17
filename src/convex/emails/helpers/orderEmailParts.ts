// UTILS
import { escapeHtml } from '../../../shared/utils/escapeHtml.js';
import { formatPrice } from '../../../shared/utils/pricing.js';

// TYPES
import type { OrderEmailData, OrderItemEmailData } from '../types/emailTypes.js';

/** Parts shared by the order emails: the formatted total and the item lines/rows. */
export function orderEmailParts(order: OrderEmailData, items: OrderItemEmailData[]) {
	return {
		total: formatPrice(order.totalInCents, order.currency, 'en'),
		lines: items.map((item) => `${item.quantity} x ${item.name}`).join('\n'),
		itemRows: items
			.map((item) => `<li style="margin:0 0 8px;">${item.quantity} x ${escapeHtml(item.name)}</li>`)
			.join('')
	};
}
