import pino from 'pino';
import { env } from '$env/dynamic/private';

// Structured JSON logger to stdout. No transport is configured, which keeps it
// robust under the bundled adapter-node server; set LOG_LEVEL to control
// verbosity (default: info). Request-scoped child loggers (carrying a
// requestId) are created in hooks.server.ts and exposed via `event.locals.log`.
export const logger = pino({
	level: env.LOG_LEVEL ?? 'info'
});

export type Logger = typeof logger;
