import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { apiKeys, emailAuditLog, dnsVerifications } from '$lib/server/db/schema';
import { eq, and, isNull, count, gte } from 'drizzle-orm';
import { isEnabled } from '$lib/feature-flags';

export const load: PageServerLoad = async ({ parent }) => {
	const { organization } = await parent();
	const orgId = organization.id;

	const [keyCount] = await db
		.select({ count: count() })
		.from(apiKeys)
		.where(and(eq(apiKeys.orgId, orgId), isNull(apiKeys.revokedAt)));

	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const [emailCount] = await db
		.select({ count: count() })
		.from(emailAuditLog)
		.where(and(eq(emailAuditLog.orgId, orgId), gte(emailAuditLog.signedAt, thirtyDaysAgo)));

	const dnsResults = await db
		.select()
		.from(dnsVerifications)
		.where(eq(dnsVerifications.orgId, orgId))
		.limit(1);

	return {
		stats: {
			activeKeys: keyCount.count,
			emailsThisMonth: emailCount.count,
			dnsVerified: dnsResults[0]?.verified ?? false
		},
		featureFlags: {
			apiKeys: isEnabled('portalApiKeys'),
			orgInfo: isEnabled('portalOrgInfo'),
			emailLog: isEnabled('portalEmailLog'),
			dns: isEnabled('portalDns')
		}
	};
};
