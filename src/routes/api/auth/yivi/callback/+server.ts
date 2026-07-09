import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	verifyYiviSession,
	parseRequestorTokenCookie,
	YIVI_RT_COOKIE,
	YIVI_RT_COOKIE_PATH
} from '$lib/server/auth/yivi';
import { createSession, findAdminByAttributes } from '$lib/server/auth/session';
import { findUserByEmail } from '$lib/server/services/users';

export const POST: RequestHandler = async ({ cookies }) => {
	// The requestor token is never sent by the client; it was bound to this
	// browser server-side when the login session was started. Consume it here.
	const pending = parseRequestorTokenCookie(cookies.get(YIVI_RT_COOKIE));
	cookies.delete(YIVI_RT_COOKIE, { path: YIVI_RT_COOKIE_PATH });

	if (!pending || (pending.purpose !== 'login-org' && pending.purpose !== 'login-admin')) {
		error(400, 'No pending Yivi login session');
	}

	// The login kind is fixed by what was disclosed at session start, not by
	// anything the client sends now.
	const type: 'org' | 'admin' = pending.purpose === 'login-admin' ? 'admin' : 'org';

	const result = await verifyYiviSession(pending.token);

	if (!result.valid) {
		error(401, 'Yivi verification failed');
	}

	let userId: string | null = null;
	let orgId: string | null = null;
	let adminId: string | null = null;

	if (type === 'org') {
		if (!result.attributes.email) {
			error(401, 'Email attribute not disclosed');
		}
		const found = await findUserByEmail(result.attributes.email);
		if (!found) {
			error(403, 'No account found for this email. Please register first.');
		}
		if (found.org.status !== 'active') {
			error(403, 'Your organization is not yet approved.');
		}
		userId = found.user.id;
		orgId = found.org.id;
	} else {
		if (!result.attributes.email || !result.attributes.fullName || !result.attributes.phone) {
			error(401, 'Required attributes not disclosed');
		}
		const admin = await findAdminByAttributes(
			result.attributes.email,
			result.attributes.fullName,
			result.attributes.phone
		);
		if (!admin) {
			error(403, 'Not authorized as admin');
		}
		adminId = admin.id;
	}

	const sessionToken = await createSession(type, userId, orgId, adminId, result.attributes);

	cookies.set('pg_session', sessionToken, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 8 * 60 * 60 // 8 hours
	});

	return json({ success: true, userType: type });
};
