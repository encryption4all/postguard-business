import { test, expect } from '@playwright/test';

test('readiness endpoint reports ready when the database is reachable', async ({ request }) => {
	const response = await request.get('/readyz');
	expect(response.status()).toBe(200);
	const body = await response.json();
	expect(body.status).toBe('ready');
	expect(body.checks.database).toBe('ok');
});
