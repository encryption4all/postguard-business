import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { config } from '$lib/server/config';

// Parse a positive-integer env var, falling back to a default when unset/invalid.
export function intFromEnv(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// DATABASE_URL is validated in config (fails fast at startup if unset). Pool
// sizing/timeouts stay tunable here via env. postgres.js otherwise leaves
// connect/idle timeouts effectively unbounded, and `max` should be sized
// against Postgres `max_connections` across replicas.
const client = postgres(config.DATABASE_URL, {
	max: intFromEnv(env.DB_POOL_MAX, 10),
	idle_timeout: intFromEnv(env.DB_IDLE_TIMEOUT, 20), // seconds
	connect_timeout: intFromEnv(env.DB_CONNECT_TIMEOUT, 10), // seconds
	max_lifetime: intFromEnv(env.DB_MAX_LIFETIME, 60 * 30) // seconds
});

export const db = drizzle(client, { schema });
