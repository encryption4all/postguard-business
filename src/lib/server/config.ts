import { z } from 'zod';
import { env } from '$env/dynamic/private';

// Env booleans are strings; match the app's existing `=== 'true'` semantics
// exactly (only the literal "true" is truthy; unset → false).
const boolFromEnv = z.preprocess((v) => v === 'true', z.boolean());

// Single source of truth for the server's environment configuration. Validated
// once at startup so a missing/mistyped var fails fast with a clear message,
// rather than surfacing at the first use of each value.
export const configSchema = z.object({
	DATABASE_URL: z.string().min(1),

	// Yivi / IRMA. Injected via docker-compose / k8s in real environments.
	YIVI_SERVER_URL: z.string().min(1).default('http://localhost:8088'),
	YIVI_SERVER_TOKEN: z.string().default(''),
	YIVI_DEMO_ATTRIBUTES: boolFromEnv,

	// Feature flags (FF_*).
	FF_PRICING_PAGE: boolFromEnv,
	FF_REGISTRATION: boolFromEnv,
	FF_PORTAL_API_KEYS: boolFromEnv,
	FF_PORTAL_ORG_INFO: boolFromEnv,
	FF_PORTAL_EMAIL_LOG: boolFromEnv,
	FF_PORTAL_DNS: boolFromEnv,
	FF_PORTAL_MEMBERS: boolFromEnv,
	FF_ADMIN_PANEL: boolFromEnv,
	FF_ADMIN_ORG_STATUS: boolFromEnv,
	FF_ADMIN_AUDIT_LOG: boolFromEnv,
	FF_ADMIN_IMPERSONATION: boolFromEnv
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
	const parsed = configSchema.safeParse(env);
	if (!parsed.success) {
		const issues = parsed.error.issues
			.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
			.join('\n');
		throw new Error(`Invalid environment configuration:\n${issues}`);
	}
	return parsed.data;
}

export const config = loadConfig();
