import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { adminAccounts } from '../src/lib/server/db/schema';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

async function main() {
	console.log('Seeding database...');

	// Insert default admin account (if not exists)
	await db
		.insert(adminAccounts)
		.values({
			email: 'admin@postguard.eu',
			fullName: 'PostGuard Admin',
			phone: '+31000000000',
			isActive: true
		})
		.onConflictDoNothing({ target: adminAccounts.email });

	console.log('Default admin account created:');
	console.log('  Email:     admin@postguard.eu');
	console.log('  Full name: PostGuard Admin');
	console.log('  Phone:     +31000000000');
	console.log('');
	console.log('To log in as admin, use Yivi to disclose these exact attributes.');

	await client.end();
}

main().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
