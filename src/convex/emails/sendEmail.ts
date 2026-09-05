// CONFIG
import { EMAIL_DATA } from './data/emailData.js';

// TYPES
import type { SendEmailOptions } from './types/emailTypes.js';

// TEMPLATES
import { renderFooterTemplate } from './templates/footerTemplate.js';
import { renderHeaderTemplate } from './templates/headerTemplate.js';

// UTILS
import { escapeHtml } from '../../shared/utils/escapeHtml.js';

const RESEND_API_URL = 'https://api.resend.com/emails';

function renderEmailDocument({
	subject,
	content,
	previewText
}: Pick<SendEmailOptions, 'subject' | 'content' | 'previewText'>): string {
	const escapedSubject = escapeHtml(subject);
	const preview = escapeHtml(previewText ?? subject);
	const { COLORS, LAYOUT, TYPOGRAPHY } = EMAIL_DATA;

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="color-scheme" content="light">
		<meta name="supported-color-schemes" content="light">
		<title>${escapedSubject}</title>
	</head>
	<body style="margin:0;background-color:${COLORS.BACKGROUND};color:${COLORS.FOREGROUND};font-family:${TYPOGRAPHY.FONT_FAMILY};">
		<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preview}</div>
		${renderHeaderTemplate()}
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.BACKGROUND};">
			<tr>
				<td align="center" style="padding:${LAYOUT.OUTER_PADDING};">
					<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${LAYOUT.CONTENT_WIDTH};background-color:${COLORS.CARD};border:1px solid ${COLORS.BORDER};border-radius:${LAYOUT.CARD_RADIUS};">
						<tr>
							<td style="padding:${LAYOUT.CARD_PADDING};font-family:${TYPOGRAPHY.FONT_FAMILY};color:${COLORS.CARD_FOREGROUND};">
								${content}
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
		${renderFooterTemplate()}
	</body>
</html>`;
}

export async function sendEmail({
	to,
	subject,
	content,
	text,
	previewText
}: SendEmailOptions): Promise<void> {
	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.EMAIL_FROM;

	if (!apiKey || !from) {
		throw new Error('Missing RESEND_API_KEY or EMAIL_FROM');
	}

	const response = await fetch(RESEND_API_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from,
			to,
			subject,
			html: renderEmailDocument({ subject, content, previewText }),
			text: text ?? previewText ?? subject
		})
	});

	if (!response.ok) {
		throw new Error(`Resend returned HTTP ${response.status}`);
	}
}
