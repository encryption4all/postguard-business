import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

// Readiness probe: reports 200 only when the app can actually serve traffic
// (i.e. the database is reachable). This is distinct from /health, which is a
// pure liveness check. Orchestrator readiness gates should point here; the
// container liveness HEALTHCHECK stays on /health.
// A readiness verdict must never be cached: the endpoint flips between
// 200/ready and 503/unavailable, and a stale cached response could mis-gate
// traffic. Mark every response no-store so no intermediary reuses it.
const NO_STORE = { 'Cache-Control': 'no-store' };

export const GET: RequestHandler = async () => {
	try {
		await db.execute(sql`select 1`);
	} catch (err) {
		console.error('[readyz] database check failed', err);
		return json(
			{ status: 'unavailable', checks: { database: 'down' } },
			{ status: 503, headers: NO_STORE }
		);
	}

	return json({ status: 'ready', checks: { database: 'ok' } }, { headers: NO_STORE });
};
