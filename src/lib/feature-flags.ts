import { env } from '$env/dynamic/private';

export const flags = {
	landingPage: true,
	pricingPage: env.FF_PRICING_PAGE === 'true',
	registration: env.FF_REGISTRATION === 'true',
	portalApiKeys: env.FF_PORTAL_API_KEYS === 'true',
	portalOrgInfo: env.FF_PORTAL_ORG_INFO === 'true',
	portalEmailLog: env.FF_PORTAL_EMAIL_LOG === 'true',
	portalDns: env.FF_PORTAL_DNS === 'true',
	adminPanel: env.FF_ADMIN_PANEL === 'true',
	adminImpersonation: env.FF_ADMIN_IMPERSONATION === 'true'
} as const;

export type FeatureFlag = keyof typeof flags;

export function isEnabled(flag: FeatureFlag): boolean {
	return flags[flag];
}
