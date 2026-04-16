import type { Handle } from '@sveltejs/kit';
import { resolveSession } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('pg_session');

	if (token) {
		const session = await resolveSession(token);
		event.locals.session = session;
	} else {
		event.locals.session = null;
	}

	return resolve(event);
};
