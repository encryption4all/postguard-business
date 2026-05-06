import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const text = await request.text();
		console.warn('[csp-report]', text.slice(0, 4096));
	} catch {
		// ignore — best-effort
	}
	return new Response(null, { status: 204 });
};
