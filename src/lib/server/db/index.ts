import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// Parse a positive-integer env var, falling back to a default when unset/invalid.
function intFromEnv(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// Explicit pool sizing + timeouts. postgres.js otherwise leaves connect/idle
// timeouts effectively unbounded, and `max` should be sized against Postgres
// `max_connections` across replicas — so make it tunable via env.
const client = postgres(env.DATABASE_URL, {
	max: intFromEnv(env.DB_POOL_MAX, 10),
	idle_timeout: intFromEnv(env.DB_IDLE_TIMEOUT, 20), // seconds
	connect_timeout: intFromEnv(env.DB_CONNECT_TIMEOUT, 10), // seconds
	max_lifetime: intFromEnv(env.DB_MAX_LIFETIME, 60 * 30) // seconds
});

export const db = drizzle(client, { schema });
