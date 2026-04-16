import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getYiviSessionResult } from '$lib/server/auth/yivi';
import {
	createSession,
	findOrgByEmail,
	findAdminByAttributes
} from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	const { token, type } = body as { token: string; type: 'org' | 'admin' };

	if (!token || (type !== 'org' && type !== 'admin')) {
		error(400, 'Missing token or invalid type');
	}

	const result = await getYiviSessionResult(token);

	if (!result.valid) {
		error(401, 'Yivi verification failed');
	}

	let orgId: string | null = null;
	let adminId: string | null = null;

	if (type === 'org') {
		if (!result.attributes.email) {
			error(401, 'Email attribute not disclosed');
		}
		const org = await findOrgByEmail(result.attributes.email);
		if (!org) {
			error(403, 'No organization found for this email. Please register first.');
		}
		if (org.status !== 'active') {
			error(403, 'Your organization is not yet approved.');
		}
		orgId = org.id;
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

	const sessionToken = await createSession(type, orgId, adminId, result.attributes);

	cookies.set('pg_session', sessionToken, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 8 * 60 * 60 // 8 hours
	});

	return json({ success: true, userType: type });
};
