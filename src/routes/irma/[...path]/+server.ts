import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { YIVI_SERVER_URL, YIVI_SERVER_TOKEN } from '$lib/server/auth/yivi';
import { isAllowed } from './allowlist';

const handler: RequestHandler = async ({ params, request }) => {
	if (!isAllowed(params.path)) {
		error(403, 'Forbidden');
	}

	const url = `${YIVI_SERVER_URL}/${params.path}`;

	const headers: Record<string, string> = {};
	const contentType = request.headers.get('content-type');
	if (contentType) headers['Content-Type'] = contentType;
	if (YIVI_SERVER_TOKEN) headers['Authorization'] = YIVI_SERVER_TOKEN;

	const response = await fetch(url, {
		method: request.method,
		headers,
		body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined
	});

	return new Response(response.body, {
		status: response.status,
		headers: {
			'Content-Type': response.headers.get('Content-Type') ?? 'application/json'
		}
	});
};

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
