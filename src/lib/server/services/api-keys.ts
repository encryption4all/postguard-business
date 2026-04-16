import { db } from '$lib/server/db';
import { apiKeys } from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { randomBytes, createHash } from 'crypto';

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
	const raw = `PG-${randomBytes(24).toString('base64url')}`;
	const hash = createHash('sha256').update(raw).digest('hex');
	const prefix = raw.substring(0, 10);
	return { raw, hash, prefix };
}

export async function listApiKeys(orgId: string) {
	return db
		.select({
			id: apiKeys.id,
			keyPrefix: apiKeys.keyPrefix,
			name: apiKeys.name,
			signingAttrs: apiKeys.signingAttrs,
			createdAt: apiKeys.createdAt,
			lastUsedAt: apiKeys.lastUsedAt,
			expiresAt: apiKeys.expiresAt,
			revokedAt: apiKeys.revokedAt
		})
		.from(apiKeys)
		.where(and(eq(apiKeys.orgId, orgId), isNull(apiKeys.revokedAt)))
		.orderBy(desc(apiKeys.createdAt));
}

export async function createApiKey(
	orgId: string,
	name: string,
	signingAttrs: Record<string, boolean>,
	expiresAt: Date
): Promise<string> {
	const { raw, hash, prefix } = generateApiKey();

	await db.insert(apiKeys).values({
		keyHash: hash,
		keyPrefix: prefix,
		name,
		orgId,
		signingAttrs,
		expiresAt
	});

	return raw;
}

export async function revokeApiKey(keyId: string, orgId: string): Promise<boolean> {
	const result = await db
		.update(apiKeys)
		.set({ revokedAt: new Date() })
		.where(and(eq(apiKeys.id, keyId), eq(apiKeys.orgId, orgId), isNull(apiKeys.revokedAt)));

	return (result.length ?? 0) > 0;
}
