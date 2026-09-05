/**
 * Auth error codes — logic sets one of these; markup resolves its Paraglide message key.
 */
export type SignUpErrorCode =
	| 'PASSWORDS_DO_NOT_MATCH'
	| 'INVALID_EMAIL'
	| 'PASSWORD_TOO_SHORT'
	| 'USER_ALREADY_EXISTS'
	| 'INVALID_OTP'
	| 'OTP_EXPIRED'
	| 'TOO_MANY_ATTEMPTS'
	| 'SOMETHING_WENT_WRONG';
