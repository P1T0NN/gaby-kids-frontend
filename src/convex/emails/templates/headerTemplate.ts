// DATA
import { EMAIL_DATA } from '../data/emailData.js';

export function renderHeaderTemplate(): string {
	const { BRAND, COLORS, LAYOUT, TYPOGRAPHY } = EMAIL_DATA;
	const BRAND_CONTENT = BRAND.URL
		? `<a href="${BRAND.URL}" style="color:${COLORS.PRIMARY_FOREGROUND};text-decoration:none;">`
		: '<span style="color:' + COLORS.PRIMARY_FOREGROUND + ';">';
	const BRAND_CLOSE = BRAND.URL ? '</a>' : '</span>';

	return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.PRIMARY};">
	<tr>
		<td align="center" style="padding:${LAYOUT.OUTER_PADDING};">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${LAYOUT.CONTENT_WIDTH};">
			<tr>
				<td style="font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:18px;font-weight:700;line-height:24px;">
					${BRAND_CONTENT}
						<span style="display:inline-block;width:28px;height:28px;margin-right:8px;border-radius:8px;background-color:${COLORS.PRIMARY_FOREGROUND};color:${COLORS.PRIMARY};font-size:15px;line-height:28px;text-align:center;vertical-align:middle;">${BRAND.MARK}</span>
						<span style="vertical-align:middle;">${BRAND.NAME}</span>
					${BRAND_CLOSE}
				</td>
			</tr>
			</table>
		</td>
	</tr>
</table>`;
}
