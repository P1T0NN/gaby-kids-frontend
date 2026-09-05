// SVELTEKIT IMPORTS
import { RESEND_API_KEY, EMAIL_FROM } from '$env/static/private';

// LIBRARIES
import { Resend } from 'resend';

const resend = new Resend(RESEND_API_KEY);

type OTPType = 'sign-in' | 'change-email' | 'email-verification' | 'forget-password';

const SUBJECTS = {
	'sign-in': 'Your sign-in code',
	'change-email': 'Verify your new email',
	'email-verification': 'Verify your email',
	'forget-password': 'Reset your password'
} satisfies Record<OTPType, string>;

/**
 * Send an email-OTP. Fire-and-forget: the promise resolves immediately so the
 * auth endpoint responds uniformly (better-auth recommends this to avoid timing
 * attacks); send failures are logged, not surfaced.
 */
export async function sendOtpEmail({
	email,
	otp,
	type
}: {
	email: string;
	otp: string;
	type: OTPType;
}) {
	void resend.emails
		.send({
			from: EMAIL_FROM,
			to: email,
			subject: SUBJECTS[type],
			html: `<p>Your code is:</p><h1>${otp}</h1>`
		})
		.catch((err) => console.error('[emailOTP] send failed', err));
}
