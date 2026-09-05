// CONFIG
import { COMPANY_DATA } from '../../../shared/config.js';

// DATA
import { EMAIL_DATA } from '../data/emailData.js';

export function renderFooterTemplate(): string {
	const { BRAND, COLORS, LAYOUT, TYPOGRAPHY } = EMAIL_DATA;
	const { EMAIL_COPY } = COMPANY_DATA;
	const YEAR = new Date().getUTCFullYear();
	const BRAND_LINK = BRAND.URL
		? `<a href="${BRAND.URL}" style="color:${COLORS.MUTED_FOREGROUND};text-decoration:underline;">${BRAND.NAME}</a>`
		: BRAND.NAME;

	return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.BACKGROUND};">
	<tr>
		<td align="center" style="padding:0 ${LAYOUT.OUTER_PADDING} ${LAYOUT.OUTER_PADDING};">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${LAYOUT.CONTENT_WIDTH};">
			<tr>
				<td style="border-top:1px solid ${COLORS.BORDER};padding-top:24px;text-align:center;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:12px;line-height:18px;color:${COLORS.MUTED_FOREGROUND};">
					<p style="margin:0 0 8px;">${EMAIL_COPY.FOOTER_NOTICE}</p>
					<p style="margin:0 0 8px;">${EMAIL_COPY.IGNORE_NOTICE}</p>
					<p style="margin:0;">&copy; ${YEAR} ${BRAND_LINK}. All rights reserved.</p>
				</td>
			</tr>
			</table>
		</td>
	</tr>
</table>`;
}
