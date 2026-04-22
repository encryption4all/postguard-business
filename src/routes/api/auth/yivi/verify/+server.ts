import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyYiviSession } from '$lib/server/auth/yivi';

/**
 * Verify a Yivi disclosure and return the disclosed attributes.
 * Used by the registration flow — no session is created.
 */
export const POST: RequestHandler = async ({ request }) => {
	const { irmaSessionToken } = (await request.json()) as { irmaSessionToken: string };

	if (!irmaSessionToken) {
		error(400, 'Missing irmaSessionToken');
	}

	const result = await verifyYiviSession(irmaSessionToken);

	if (!result.valid) {
		error(401, 'Yivi verification failed');
	}

	if (!result.attributes.email || !result.attributes.fullName) {
		error(401, 'Required attributes (email, full name) not disclosed');
	}

	return json({ attributes: result.attributes });
};
