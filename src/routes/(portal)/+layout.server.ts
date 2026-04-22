import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { organizations, users } from '$lib/server/db/schema';
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

	// Load the current user (for org users) or the contact person (for impersonating admins)
	let user = null;
	if (isOrgUser && locals.session.userId) {
		const result = await db
			.select()
			.from(users)
			.where(eq(users.id, locals.session.userId))
			.limit(1);
		user = result[0] ?? null;
	}

	// Load contact person
	let contactPerson = null;
	if (org.contactUserId) {
		const result = await db
			.select()
			.from(users)
			.where(eq(users.id, org.contactUserId))
			.limit(1);
		contactPerson = result[0]
			? { id: result[0].id, fullName: result[0].fullName, email: result[0].email, phone: result[0].phone }
			: null;
	}

	return {
		organization: {
			id: org.id,
			name: org.name,
			domain: org.domain,
			signingEmail: org.signingEmail,
			kvkNumber: org.kvkNumber,
			contactUserId: org.contactUserId,
			status: org.status
		},
		user: user
			? { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone }
			: null,
		contactPerson,
		isImpersonating: !!isImpersonating,
		featureFlags: {
			apiKeys: isEnabled('portalApiKeys'),
			orgInfo: isEnabled('portalOrgInfo'),
			emailLog: isEnabled('portalEmailLog'),
			dns: isEnabled('portalDns'),
			members: isEnabled('portalMembers')
		}
	};
};
