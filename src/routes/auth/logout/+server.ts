import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { destroySession } from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('pg_session');
	if (token) {
		await destroySession(token);
		cookies.delete('pg_session', { path: '/' });
	}
	redirect(303, '/');
};
