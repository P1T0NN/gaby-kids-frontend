import type { Resend } from '@convex-dev/resend';

import type { Doc } from '../../_generated/dataModel.js';

export type EmailOTPType = 'sign-in' | 'change-email' | 'email-verification' | 'forget-password';

export type EmailRecipient = string | string[];

export type OtpEmailData = {
	email: string;
	otp: string;
	type: EmailOTPType;
};

export type SendEmailOptions = {
	to: EmailRecipient;
	subject: string;
	content: string;
	text?: string;
	previewText?: string;
	idempotencyKey?: string;
};

export type EmailContext = Parameters<Resend['sendEmail']>[0];

export type OrderEmailData = Pick<
	Doc<'orders'>,
	| '_id'
	| 'code'
	| 'currency'
	| 'email'
	| 'firstName'
	| 'lastName'
	| 'fulfillmentMethod'
	| 'retryKey'
	| 'totalInCents'
>;

export type OrderItemEmailData = Pick<Doc<'orderItems'>, 'name' | 'quantity' | 'unitPriceInCents'>;
