import { describe, it, expect, vi, beforeEach } from 'vitest';

const { executeMock } = vi.hoisted(() => ({
	executeMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({ db: { execute: executeMock } }));

vi.mock('drizzle-orm', () => ({
	sql: (strings: TemplateStringsArray) => strings.join('')
}));

// SvelteKit's generated $types is not available under vitest; the endpoint only
// uses the type import, so stub it out.
vi.mock('./$types', () => ({}));

import { GET } from '../../src/routes/readyz/+server';

// The route handler only reads request-independent state, so an empty event is fine.
const callGet = () => GET({} as never);

describe('/readyz readiness probe', () => {
	beforeEach(() => {
		executeMock.mockReset();
	});

	it('returns 200/ready with no-store when the database is reachable', async () => {
		executeMock.mockResolvedValueOnce(undefined);

		const response = await callGet();

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ status: 'ready', checks: { database: 'ok' } });
	});

	it('returns 503/unavailable with no-store when the database check throws', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		executeMock.mockRejectedValueOnce(new Error('connection refused'));

		const response = await callGet();

		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({
			status: 'unavailable',
			checks: { database: 'down' }
		});
		expect(consoleError).toHaveBeenCalled();

		consoleError.mockRestore();
	});
});
