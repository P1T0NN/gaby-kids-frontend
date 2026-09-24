/**
 * Branding / contact strings used by emails, headers, JSON-LD, etc.
 * Single source of truth — imported by both client and Convex.
 *
 * PLACEHOLDERS ON PURPOSE: this is a universal template, so nothing here names a real
 * business. Filling this one block re-brands the entire storefront — every page title, meta
 * description, email header/footer, structured-data record and contact link reads from here,
 * and no component hardcodes a brand string.
 *
 * Per-project checklist: NAME · EMAIL · RESEND_EMAIL (must be a domain-verified sender before
 * production — see EmailSystemDesign.md §7.2) · DOMAIN · LOGO (replace the asset in
 * `static/logo/`) · DESCRIPTION · WHATSAPP_NUMBER · ADDRESS · HOURS · INSTAGRAM_URL · PHONE ·
 * OG_IMAGE (replace the asset in `static/assets/`).
 */
const WHATSAPP_NUMBER = '+1 555 555 0100';

export const COMPANY_DATA = {
	NAME: 'Company Name',
	EMAIL: 'ognjen.tapuskovic@gmail.com',
	RESEND_EMAIL: 'onboarding@resend.dev',
	EMAIL_COPY: {
		FOOTER_NOTICE: 'You are receiving this email because of activity on your account.',
		IGNORE_NOTICE: 'If you did not request this email, you can safely ignore it.'
	},
	DOMAIN: 'companyname.com',
	/** Currency code used by storefront price formatting. Replace for the project. */
	CURRENCY: 'MXN',
	/** IANA store timezone: every dashboard day boundary and bucket is computed in this zone. */
	TIMEZONE: 'UTC',
	LOGO: '/logo/opt/logo-1536w.webp',
	DESCRIPTION: 'Description',
	WHATSAPP_NUMBER,
	WHATSAPP_CONTACT_URL: `https://wa.me/${WHATSAPP_NUMBER}`,
	INSTAGRAM_URL: 'https://www.instagram.com/companyname/',
	/** Display phone, INCLUDING the country code — structured data strips the spaces to build
	 *  the E.164 `telephone`, so the country must live here rather than in code. */
	PHONE: '+1 555 555 0100',
	OG_IMAGE: '/assets/og-image.png',
	OG_IMAGE_WIDTH: 1200,
	OG_IMAGE_HEIGHT: 630
} as const;
