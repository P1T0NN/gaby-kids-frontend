// EMAILS
import { sendEmail } from '../../emails/sendEmail.js';

// CONFIG
import { COMPANY_DATA } from '../../../shared/config.js';

// DATA
import { EMAIL_DATA } from '../../emails/data/emailData.js';

// TYPES
import type { EmailOTPType, OtpEmailData } from '../../emails/types/emailTypes.js';

const OTP_COPY = {
	'sign-in': {
		subject: 'Your sign-in code',
		preview: 'Use this code to sign in to your account.',
		heading: 'Sign in to your account',
		instruction: 'Use the verification code below to finish signing in.'
	},
	'change-email': {
		subject: 'Verify your new email',
		preview: 'Use this code to verify your new email address.',
		heading: 'Verify your new email',
		instruction: 'Use the verification code below to confirm your new email address.'
	},
	'email-verification': {
		subject: 'Verify your email',
		preview: 'Use this code to verify your email address.',
		heading: 'Verify your email address',
		instruction: 'Use the verification code below to verify your email address.'
	},
	'forget-password': {
		subject: 'Reset your password',
		preview: 'Use this code to reset your password.',
		heading: 'Reset your password',
		instruction: 'Use the verification code below to continue resetting your password.'
	}
} satisfies Record<
	EmailOTPType,
	{ subject: string; preview: string; heading: string; instruction: string }
>;

export async function sendOtpEmail({ email, otp, type }: OtpEmailData): Promise<void> {
	const copy = OTP_COPY[type];
	const { COLORS, TYPOGRAPHY } = EMAIL_DATA;
	const { EMAIL_COPY } = COMPANY_DATA;

	await sendEmail({
		to: email,
		subject: copy.subject,
		previewText: copy.preview,
		text: `${copy.heading}\n\n${copy.instruction}\n\nCode: ${otp}\n\n${EMAIL_COPY.IGNORE_NOTICE}`,
		content: `
			<h1 style="margin:0 0 16px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:28px;line-height:36px;font-weight:700;color:${COLORS.FOREGROUND};">${copy.heading}</h1>
			<p style="margin:0 0 24px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:16px;line-height:24px;color:${COLORS.MUTED_FOREGROUND};">${copy.instruction}</p>
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:${COLORS.SECONDARY};border:1px solid ${COLORS.BORDER};border-radius:8px;">
				<tr>
					<td align="center" style="padding:20px 16px;">
						<span style="font-family:${TYPOGRAPHY.MONOSPACE};font-size:32px;line-height:40px;letter-spacing:8px;font-weight:700;color:${COLORS.FOREGROUND};">${otp}</span>
					</td>
				</tr>
			</table>
			<p style="margin:0;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:13px;line-height:20px;color:${COLORS.MUTED_FOREGROUND};">${EMAIL_COPY.IGNORE_NOTICE}</p>
		`
	});
}
