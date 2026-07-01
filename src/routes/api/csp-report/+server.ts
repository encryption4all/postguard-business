import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const text = await request.text();
		locals.log.warn({ report: text.slice(0, 4096) }, 'csp violation');
	} catch {
		// ignore — best-effort
	}
	return new Response(null, { status: 204 });
};
