import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { startYiviSession } from '$lib/server/auth/yivi';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const type = body.type as 'org' | 'admin';

	if (type !== 'org' && type !== 'admin') {
		error(400, 'Invalid session type');
	}

	const session = await startYiviSession(type);
	return json(session);
};
