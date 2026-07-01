import { dev } from '$app/environment';
import { config } from '$lib/server/config';

export type FeatureFlag =
	| 'pricingPage'
	| 'registration'
	| 'portalApiKeys'
	| 'portalOrgInfo'
	| 'portalEmailLog'
	| 'portalDns'
	| 'portalMembers'
	| 'adminPanel'
	| 'adminOrgStatus'
	| 'adminAuditLog'
	| 'adminImpersonation';

export const FLAG_LABELS: Record<FeatureFlag, string> = {
	pricingPage: 'Pricing page',
	registration: 'Registration page',
	portalApiKeys: 'Portal: API keys',
	portalOrgInfo: 'Portal: Organization info',
	portalEmailLog: 'Portal: Email audit log',
	portalDns: 'Portal: DNS verification',
	portalMembers: 'Portal: Members',
	adminPanel: 'Admin panel',
	adminOrgStatus: 'Admin: Org status (activate/suspend)',
	adminAuditLog: 'Admin: Audit log',
	adminImpersonation: 'Admin: Impersonation'
};

/** Flags from environment variables (immutable, set at startup). */
const envFlags: Record<FeatureFlag, boolean> = {
	pricingPage: config.FF_PRICING_PAGE,
	registration: config.FF_REGISTRATION,
	portalApiKeys: config.FF_PORTAL_API_KEYS,
	portalOrgInfo: config.FF_PORTAL_ORG_INFO,
	portalEmailLog: config.FF_PORTAL_EMAIL_LOG,
	portalDns: config.FF_PORTAL_DNS,
	portalMembers: config.FF_PORTAL_MEMBERS,
	adminPanel: config.FF_ADMIN_PANEL,
	adminOrgStatus: config.FF_ADMIN_ORG_STATUS,
	adminAuditLog: config.FF_ADMIN_AUDIT_LOG,
	adminImpersonation: config.FF_ADMIN_IMPERSONATION
};

/** Runtime overrides — only used in dev mode. */
const devOverrides = new Map<FeatureFlag, boolean>();

export function isEnabled(flag: FeatureFlag): boolean {
	if (dev && devOverrides.has(flag)) {
		return devOverrides.get(flag)!;
	}
	return envFlags[flag];
}

export function getAllFlags(): Record<FeatureFlag, { value: boolean; source: 'env' | 'override' }> {
	const result = {} as Record<FeatureFlag, { value: boolean; source: 'env' | 'override' }>;
	for (const flag of Object.keys(envFlags) as FeatureFlag[]) {
		if (dev && devOverrides.has(flag)) {
			result[flag] = { value: devOverrides.get(flag)!, source: 'override' };
		} else {
			result[flag] = { value: envFlags[flag], source: 'env' };
		}
	}
	return result;
}

/** Only works in dev mode. No-op in production. */
export function setFlag(flag: FeatureFlag, value: boolean): boolean {
	if (!dev) return false;
	devOverrides.set(flag, value);
	return true;
}

/** Only works in dev mode. Resets a flag to its env value. */
export function resetFlag(flag: FeatureFlag): boolean {
	if (!dev) return false;
	devOverrides.delete(flag);
	return true;
}

/** Whether runtime flag toggling is available. */
export const canToggleFlags = dev;
