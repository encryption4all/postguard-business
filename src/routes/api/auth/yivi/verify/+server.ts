import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	verifyYiviSession,
	parseRequestorTokenCookie,
	YIVI_RT_COOKIE,
	YIVI_RT_COOKIE_PATH
} from '$lib/server/auth/yivi';

/**
 * Verify a Yivi disclosure and return the disclosed attributes.
 * Used by the registration flow — no app session is created.
 */
export const POST: RequestHandler = async ({ cookies }) => {
	// The requestor token was bound to this browser server-side when the
	// registration disclosure was started; the client never sees it.
	const pending = parseRequestorTokenCookie(cookies.get(YIVI_RT_COOKIE));
	cookies.delete(YIVI_RT_COOKIE, { path: YIVI_RT_COOKIE_PATH });

	if (!pending || pending.purpose !== 'register') {
		error(400, 'No pending Yivi verification session');
	}

	const result = await verifyYiviSession(pending.token);

	if (!result.valid) {
		error(401, 'Yivi verification failed');
	}

	if (!result.attributes.email || !result.attributes.fullName) {
		error(401, 'Required attributes (email, full name) not disclosed');
	}

	return json({ attributes: result.attributes });
};
