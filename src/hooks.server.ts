import type { Handle, HandleServerError } from '@sveltejs/kit';
import { resolveSession } from '$lib/server/auth/session';
import { YIVI_SERVER_URL } from '$lib/server/auth/yivi';
import { appendConnectSrc } from '$lib/server/csp';
import { normalizeLocale } from '$lib/i18n';
import { logger } from '$lib/server/logger';

const REQUEST_ID_MAX = 64;

// The Yivi frontend SDK connects straight to the IRMA server: it builds its
// status-polling and cancel URLs from `sessionPtr.u`, which points at the
// server's public origin. That origin is runtime configuration (it differs
// per environment), so it can't live in the build-time CSP in svelte.config.js
// and is appended to connect-src per-response instead.
const YIVI_ORIGIN = new URL(YIVI_SERVER_URL).origin;

// Use a client-supplied X-Request-Id when present (sanitised), otherwise mint
// one. Keeps correlation across a proxy without trusting arbitrary input.
function resolveRequestId(header: string | null): string {
	if (header) {
		const cleaned = header.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, REQUEST_ID_MAX);
		if (cleaned) return cleaned;
	}
	return crypto.randomUUID();
}

export const handle: Handle = async ({ event, resolve }) => {
	const requestId = resolveRequestId(event.request.headers.get('x-request-id'));
	event.locals.requestId = requestId;
	event.locals.log = logger.child({ requestId });

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

	const start = performance.now();
	const response = await resolve(event);
	const durationMs = Math.round(performance.now() - start);

	for (const header of ['content-security-policy', 'content-security-policy-report-only']) {
		const csp = response.headers.get(header);
		if (csp) response.headers.set(header, appendConnectSrc(csp, YIVI_ORIGIN));
	}

	response.headers.set('X-Request-Id', requestId);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	// Skip the noisy liveness/readiness probes.
	const path = event.url.pathname;
	if (path !== '/health' && path !== '/readyz') {
		event.locals.log.info(
			{ method: event.request.method, path, status: response.status, durationMs },
			'request'
		);
	}

	return response;
};

export const handleError: HandleServerError = ({ error, event, status, message }) => {
	logger.error(
		{
			requestId: event.locals.requestId,
			method: event.request.method,
			path: event.url.pathname,
			status,
			err: error instanceof Error ? { message: error.message, stack: error.stack } : String(error)
		},
		'unhandled error'
	);

	return { message };
};
