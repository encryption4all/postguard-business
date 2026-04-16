import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createHash, randomBytes } from 'crypto';
import {
	adminAccounts,
	organizations,
	apiKeys,
	dnsVerifications
} from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

async function main() {
	console.log('Seeding database...\n');

	// 1. Default admin account
	await db
		.insert(adminAccounts)
		.values({
			email: 'admin@postguard.eu',
			fullName: 'PostGuard Admin',
			phone: '+31000000000',
			isActive: true
		})
		.onConflictDoNothing({ target: adminAccounts.email });

	console.log('Admin account:');
	console.log('  Email:     admin@postguard.eu');
	console.log('  Full name: PostGuard Admin');
	console.log('  Phone:     +31000000000\n');

	// 2. Example organization
	const [org] = await db
		.insert(organizations)
		.values({
			name: 'Acme B.V.',
			domain: 'acme.example.nl',
			email: 'admin@acme.example.nl',
			contactName: 'Jan de Vries',
			phone: '+31612345678',
			kvkNumber: '12345678',
			status: 'active'
		})
		.onConflictDoNothing({ target: organizations.domain })
		.returning();

	if (org) {
		console.log('Example organization:');
		console.log('  Name:    Acme B.V.');
		console.log('  Domain:  acme.example.nl');
		console.log('  Email:   admin@acme.example.nl');
		console.log('  Status:  active');
		console.log('  KVK:     12345678\n');

		// 3. Example API key
		const rawKey = `PG-${randomBytes(24).toString('base64url')}`;
		const keyHash = createHash('sha256').update(rawKey).digest('hex');
		const keyPrefix = rawKey.substring(0, 10);

		await db.insert(apiKeys).values({
			keyHash,
			keyPrefix,
			name: 'Production Mailer',
			orgId: org.id,
			signingAttrs: { orgName: true, phone: false, kvkNumber: true, email: true },
			expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
		});

		console.log('Example API key:');
		console.log(`  Name:    Production Mailer`);
		console.log(`  Key:     ${rawKey}`);
		console.log(`  Prefix:  ${keyPrefix}...`);
		console.log(`  Signs:   orgName, kvkNumber, email\n`);

		// 4. DNS verification record
		await db
			.insert(dnsVerifications)
			.values({
				orgId: org.id,
				domain: 'acme.example.nl',
				txtRecord: `postguard-verify=${randomBytes(16).toString('hex')}`,
				verified: false
			})
			.onConflictDoNothing();

		console.log('DNS verification record created for acme.example.nl\n');
	} else {
		console.log('Example organization already exists (skipped).\n');

		// Fetch existing org to show the API key info
		const existing = await db
			.select()
			.from(organizations)
			.where(eq(organizations.domain, 'acme.example.nl'))
			.limit(1);
		if (existing[0]) {
			const keys = await db
				.select()
				.from(apiKeys)
				.where(eq(apiKeys.orgId, existing[0].id))
				.limit(1);
			if (keys[0]) {
				console.log(`Existing API key prefix: ${keys[0].keyPrefix}...`);
			}
		}
	}

	console.log('To log in as the example org, disclose email: admin@acme.example.nl via Yivi.');
	console.log('To log in as admin, disclose: admin@postguard.eu / PostGuard Admin / +31000000000');

	await client.end();
}

main().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
