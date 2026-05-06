import type { Handle } from '@sveltejs/kit';
import { resolveSession } from '$lib/server/auth/session';
import { normalizeLocale } from '$lib/i18n';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('pg_session');

	if (token) {
		const session = await resolveSession(token);
		event.locals.session = session;
	} else {
		event.locals.session = null;
	}

	// Resolve the request locale here, but do NOT mutate the svelte-i18n
	// locale store from this hook — the store is process-global and would
	// leak across concurrent requests. The chosen locale is propagated to
	// the universal layout load via `event.locals.locale` and applied
	// per-request inside `+layout.ts`.
	event.locals.locale = normalizeLocale(event.request.headers.get('accept-language'));

	const response = await resolve(event);

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	return response;
};
