import { describe, it, expect, vi } from 'vitest';

// Importing the config module runs validation against the real env at load time;
// give it a valid DATABASE_URL so the import doesn't throw, then exercise the
// schema directly with explicit inputs.
vi.mock('$env/dynamic/private', () => ({
	env: { DATABASE_URL: 'postgres://user:pass@localhost:5432/db' }
}));

import { configSchema } from '$lib/server/config';

describe('configSchema', () => {
	it('applies sensible defaults for a minimal valid env', () => {
		const c = configSchema.parse({ DATABASE_URL: 'postgres://x' });
		expect(c.YIVI_SERVER_URL).toBe('http://localhost:8088');
		expect(c.YIVI_SERVER_TOKEN).toBe('');
		expect(c.YIVI_DEMO_ATTRIBUTES).toBe(false);
		expect(c.FF_ADMIN_PANEL).toBe(false);
	});

	it('coerces only the exact string "true" to boolean true', () => {
		const c = configSchema.parse({
			DATABASE_URL: 'postgres://x',
			YIVI_DEMO_ATTRIBUTES: 'true',
			FF_ADMIN_PANEL: 'true',
			FF_REGISTRATION: 'false',
			FF_PORTAL_DNS: 'TRUE'
		});
		expect(c.YIVI_DEMO_ATTRIBUTES).toBe(true);
		expect(c.FF_ADMIN_PANEL).toBe(true);
		expect(c.FF_REGISTRATION).toBe(false);
		expect(c.FF_PORTAL_DNS).toBe(false); // case-sensitive, matches legacy behaviour
	});

	it('rejects a missing or empty DATABASE_URL', () => {
		expect(configSchema.safeParse({}).success).toBe(false);
		expect(configSchema.safeParse({ DATABASE_URL: '' }).success).toBe(false);
	});
});
