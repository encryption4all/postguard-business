import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { setImpersonation } from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.session || locals.session.userType !== 'admin') {
		error(403, 'Forbidden');
	}
	await setImpersonation(locals.session.id, null);
	redirect(303, '/admin/organizations');
};
