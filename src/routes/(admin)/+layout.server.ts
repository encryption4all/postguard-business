import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { adminAccounts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.session || locals.session.userType !== 'admin') {
		redirect(303, `/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	const adminId = locals.session.adminId;
	if (!adminId) redirect(303, '/auth/login');

	const admins = await db
		.select()
		.from(adminAccounts)
		.where(eq(adminAccounts.id, adminId))
		.limit(1);

	const admin = admins[0];
	if (!admin) redirect(303, '/auth/login');

	return {
		admin: {
			id: admin.id,
			fullName: admin.fullName,
			email: admin.email
		},
		impersonatingOrgId: locals.session.impersonatingOrgId
	};
};
