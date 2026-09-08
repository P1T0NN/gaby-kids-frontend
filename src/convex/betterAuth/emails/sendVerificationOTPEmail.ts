// HELPERS
import { sendOtpEmail } from '../helpers/sendOtpEmail.js';

// TYPES
import type { EmailContext, OtpEmailData } from '../../emails/types/emailTypes.js';

export function sendVerificationOTPEmail(ctx: EmailContext, data: OtpEmailData): Promise<void> {
	return sendOtpEmail(ctx, data);
}
