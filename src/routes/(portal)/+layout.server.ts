import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { organizations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { isEnabled } from '$lib/feature-flags';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.session) {
		redirect(303, `/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	// Allow org users directly, or admins who are impersonating
	const isOrgUser = locals.session.userType === 'org';
	const isImpersonating =
		locals.session.userType === 'admin' && locals.session.impersonatingOrgId;

	if (!isOrgUser && !isImpersonating) {
		redirect(303, `/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	const orgId = isImpersonating ? locals.session.impersonatingOrgId : locals.session.orgId;
	if (!orgId) {
		redirect(303, '/auth/login');
	}

	const orgs = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
	const org = orgs[0];

	if (!org) {
		redirect(303, '/auth/login');
	}

	return {
		organization: {
			id: org.id,
			name: org.name,
			domain: org.domain,
			email: org.email,
			contactName: org.contactName,
			phone: org.phone,
			kvkNumber: org.kvkNumber,
			status: org.status
		},
		isImpersonating: !!isImpersonating,
		featureFlags: {
			apiKeys: isEnabled('portalApiKeys'),
			orgInfo: isEnabled('portalOrgInfo'),
			emailLog: isEnabled('portalEmailLog'),
			dns: isEnabled('portalDns')
		}
	};
};
