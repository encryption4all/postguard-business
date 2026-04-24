import type { Handle } from '@sveltejs/kit';
import { resolveSession } from '$lib/server/auth/session';
import { locale } from 'svelte-i18n';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('pg_session');

	if (token) {
		const session = await resolveSession(token);
		event.locals.session = session;
	} else {
		event.locals.session = null;
	}

	const lang = event.request.headers.get('accept-language')?.split(',')[0];
	if (lang) {
		locale.set(lang);
	}

	const response = await resolve(event);

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	return response;
};
