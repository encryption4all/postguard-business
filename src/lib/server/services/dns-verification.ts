import { db } from '$lib/server/db';
import { dnsVerifications } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { resolve } from 'dns/promises';

export async function getOrCreateDnsVerification(orgId: string, domain: string) {
	const existing = await db
		.select()
		.from(dnsVerifications)
		.where(eq(dnsVerifications.orgId, orgId))
		.limit(1);

	if (existing[0]) return existing[0];

	const txtRecord = `postguard-verify=${randomBytes(16).toString('hex')}`;

	const [created] = await db
		.insert(dnsVerifications)
		.values({ orgId, domain, txtRecord })
		.returning();

	return created;
}

export async function verifyDns(orgId: string): Promise<{
	verified: boolean;
	error?: string;
}> {
	const records = await db
		.select()
		.from(dnsVerifications)
		.where(eq(dnsVerifications.orgId, orgId))
		.limit(1);

	if (!records[0]) return { verified: false, error: 'No DNS verification record found' };

	const record = records[0];

	try {
		const txtRecords = await resolve(record.domain, 'TXT');
		const flat = txtRecords.flat();
		const found = flat.some((txt) => txt === record.txtRecord);

		if (found) {
			await db
				.update(dnsVerifications)
				.set({
					verified: true,
					verifiedAt: new Date(),
					lastCheckedAt: new Date()
				})
				.where(eq(dnsVerifications.id, record.id));
			return { verified: true };
		} else {
			await db
				.update(dnsVerifications)
				.set({ lastCheckedAt: new Date() })
				.where(eq(dnsVerifications.id, record.id));
			return {
				verified: false,
				error: `TXT record "${record.txtRecord}" not found in DNS for ${record.domain}`
			};
		}
	} catch {
		await db
			.update(dnsVerifications)
			.set({ lastCheckedAt: new Date() })
			.where(eq(dnsVerifications.id, record.id));
		return { verified: false, error: `Could not resolve DNS for ${record.domain}` };
	}
}
