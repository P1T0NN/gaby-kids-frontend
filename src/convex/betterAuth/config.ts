// LIBRARIES
import { createClient, type AuthFunctions, type GenericCtx } from '@convex-dev/better-auth';
import { requireRunMutationCtx } from '@convex-dev/better-auth/utils';
import { convex } from '@convex-dev/better-auth/plugins';
import type { BetterAuthPlugin } from 'better-auth';
import { APIError } from 'better-auth/api';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { admin } from 'better-auth/plugins/admin';
import { captcha } from 'better-auth/plugins';
import { emailOTP } from 'better-auth/plugins/email-otp';

// CONVEX
import { components, internal } from '../_generated/api.js';

// AGGREGATES
import { userTotalAggregate } from './tables/users/aggregates/userTotalAggregate.js';

// SCHEMAS
import authSchema from './component/schema.js';

// CONFIG
import authConfig from './auth.config.js';
import { TURNSTILE_ALWAYS_PASS_TEST_SECRET } from '../../shared/features/captcha/config.js';

// EMAILS
import { sendVerificationOTPEmail } from './emails/sendVerificationOTPEmail.js';

// TYPES
import type { DataModel } from '../_generated/dataModel.js';
import type { EmailContext } from '../emails/types/emailTypes.js';

const siteUrl = process.env.PUBLIC_ORIGIN!;
const turnstileSecret = process.env.TURNSTILE_SECRET_KEY!;

type BannedUserRecord = {
	id: string;
	banned?: boolean;
	banExpires?: Date | number | null;
};

function getBanDetails(user: BannedUserRecord | null): { banExpires: number | null } | null {
	if (!user?.banned) return null;

	const banExpires = user.banExpires == null ? null : new Date(user.banExpires).getTime();
	return { banExpires };
}

const bannedUserDetailsPlugin = {
	id: 'banned-user-details',
	init() {
		return {
			options: {
				databaseHooks: {
					session: {
						create: {
							async before(session, context) {
								if (!context) return;

								const user = await context.context.internalAdapter.findUserById(session.userId);
								const ban = getBanDetails(user);
								if (!ban) return;

								if (ban.banExpires !== null && ban.banExpires < Date.now()) {
									await context.context.internalAdapter.updateUser(session.userId, {
										banned: false,
										banReason: null,
										banExpires: null
									});
									return;
								}

								throw APIError.from('FORBIDDEN', {
									message: JSON.stringify({ banExpires: ban.banExpires }),
									code: 'BANNED_USER'
								});
							}
						}
					}
				}
			}
		};
	}
} satisfies BetterAuthPlugin;

const authFunctions: AuthFunctions = internal.auth;

// The component client has methods needed for integrating Better Auth with
// Convex, as well as general auth-related helpers.
export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
	local: { schema: authSchema },
	authFunctions,
	triggers: {
		user: {
			onCreate: async (ctx, doc) => userTotalAggregate.inc(ctx, 1, String(doc._id)),
			onDelete: async (ctx, doc) => {
				const ownerId = String(doc._id);
				await userTotalAggregate.inc(ctx, -1, ownerId);
				await ctx.scheduler.runAfter(
					0,
					internal.betterAuth.cleanupDeletedUserData.cleanupDeletedUserData,
					{ ownerId }
				);
			}
		}
	}
});

export const createAuthOptions = (ctx: GenericCtx<DataModel>) =>
	({
		baseURL: siteUrl,
		advanced: {
			ipAddress: {
				ipAddressHeaders: ['x-better-auth-client-ip', 'x-forwarded-for']
			}
		},
		onAPIError: {
			errorURL: '/auth/error'
		},
		database: authComponent.adapter(ctx),
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID!,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET!
			}
		},
		emailVerification: {
			sendOnSignUp: true,
			sendOnSignIn: true,
			autoSignInAfterVerification: true
		},
		emailAndPassword: {
			enabled: true,
			autoSignIn: false,
			requireEmailVerification: true
		},
		rateLimit: {
			enabled: true,
			storage: 'database',
			customRules: {
				'/convex/jwks': false,
				'/email-otp/send-verification-otp': {
					window: 60,
					max: 1
				}
			}
		},
		plugins: [
			captcha({
				provider: 'cloudflare-turnstile',
				secretKey: turnstileSecret,
				expectedAction: turnstileSecret === TURNSTILE_ALWAYS_PASS_TEST_SECRET ? undefined : 'auth',
				endpoints: [
					'/sign-up/email',
					'/sign-in/email',
					'/sign-in/social',
					'/email-otp/send-verification-otp',
					'/email-otp/verify-email',
					'/email-otp/request-password-reset',
					'/email-otp/reset-password'
				]
			}),
			bannedUserDetailsPlugin,
			admin({ bannedUserMessage: 'BANNED_USER' }),
			emailOTP({
				storeOTP: 'hashed',
				overrideDefaultEmailVerification: true,
				sendVerificationOTP: async (data) => {
					// SAFETY: both packages expose the same runtime runQuery/runMutation context;
					// their bundled Convex types disagree only on optional transaction options.
					const emailCtx = requireRunMutationCtx(ctx) as EmailContext;
					await sendVerificationOTPEmail(emailCtx, data);
				}
			}),
			// The Convex plugin is required for Convex compatibility.
			convex({ authConfig })
		]
	}) satisfies BetterAuthOptions;

export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth(createAuthOptions(ctx));
