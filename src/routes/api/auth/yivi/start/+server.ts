import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	startYiviSession,
	YIVI_RT_COOKIE,
	YIVI_RT_COOKIE_PATH,
	type YiviDisclosurePurpose
} from '$lib/server/auth/yivi';

const VALID_PURPOSES: readonly YiviDisclosurePurpose[] = ['login-org', 'login-admin', 'register'];

// The disclosure must be created and completed promptly; keep the bound
// requestor token around only briefly.
const RT_MAX_AGE = 5 * 60; // 5 minutes

/**
 * Create the Yivi disclosure session server-side with a fixed, server-defined
 * request and return only the `sessionPtr` + frontend token to the client. The
 * privileged requestor token is kept server-side, bound to this browser via an
 * HttpOnly cookie, so the later callback/verify step can fetch the result
 * without the client ever handling it.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const { purpose } = (await request.json().catch(() => ({}))) as { purpose?: string };

	if (!purpose || !VALID_PURPOSES.includes(purpose as YiviDisclosurePurpose)) {
		error(400, 'Invalid or missing purpose');
	}

	let session;
	try {
		session = await startYiviSession(purpose as YiviDisclosurePurpose);
	} catch {
		error(502, 'Could not start Yivi session');
	}

	cookies.set(YIVI_RT_COOKIE, `${purpose}:${session.token}`, {
		path: YIVI_RT_COOKIE_PATH,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: RT_MAX_AGE
	});

	return json({ sessionPtr: session.sessionPtr, frontendRequest: session.frontendRequest });
};
