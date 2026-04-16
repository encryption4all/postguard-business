import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { organizations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { isEnabled } from '$lib/feature-flags';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.session || locals.session.userType !== 'org') {
		redirect(303, `/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	const orgId = locals.session.orgId;
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
		featureFlags: {
			emailLog: isEnabled('portalEmailLog')
		}
	};
};
