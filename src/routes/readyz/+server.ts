import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

// Readiness probe: reports 200 only when the app can actually serve traffic
// (i.e. the database is reachable). This is distinct from /health, which is a
// pure liveness check. Orchestrator readiness gates should point here; the
// container liveness HEALTHCHECK stays on /health.
export const GET: RequestHandler = async () => {
	try {
		await db.execute(sql`select 1`);
	} catch (err) {
		console.error('[readyz] database check failed', err);
		return json({ status: 'unavailable', checks: { database: 'down' } }, { status: 503 });
	}

	return json({ status: 'ready', checks: { database: 'ok' } });
};
