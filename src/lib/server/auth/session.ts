import { db } from '$lib/server/db';
import { sessions, organizations, adminAccounts } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes, createHash } from 'crypto';

export interface SessionData {
	id: string;
	userType: 'org' | 'admin';
	orgId: string | null;
	adminId: string | null;
	impersonatingOrgId: string | null;
	yiviAttributes: Record<string, string>;
}

const SESSION_DURATION_HOURS = 8;

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function generateToken(): string {
	return randomBytes(32).toString('base64url');
}

export async function createSession(
	userType: 'org' | 'admin',
	orgId: string | null,
	adminId: string | null,
	yiviAttributes: Record<string, string>
): Promise<string> {
	const token = generateToken();
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

	await db.insert(sessions).values({
		tokenHash,
		userType,
		orgId,
		adminId,
		yiviAttributes,
		expiresAt
	});

	return token;
}

export async function resolveSession(token: string): Promise<SessionData | null> {
	const tokenHash = hashToken(token);

	const result = await db
		.select()
		.from(sessions)
		.where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
		.limit(1);

	if (result.length === 0) return null;

	const session = result[0];

	// Update last active timestamp
	await db
		.update(sessions)
		.set({ lastActiveAt: new Date() })
		.where(eq(sessions.id, session.id));

	return {
		id: session.id,
		userType: session.userType as 'org' | 'admin',
		orgId: session.orgId,
		adminId: session.adminId,
		impersonatingOrgId: session.impersonatingOrgId,
		yiviAttributes: (session.yiviAttributes as Record<string, string>) ?? {}
	};
}

export async function destroySession(token: string): Promise<void> {
	const tokenHash = hashToken(token);
	await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export async function findOrgByEmail(email: string) {
	const result = await db
		.select()
		.from(organizations)
		.where(eq(organizations.email, email))
		.limit(1);
	return result[0] ?? null;
}

export async function findAdminByAttributes(
	email: string,
	fullName: string,
	phone: string
) {
	const result = await db
		.select()
		.from(adminAccounts)
		.where(
			and(
				eq(adminAccounts.email, email),
				eq(adminAccounts.fullName, fullName),
				eq(adminAccounts.phone, phone),
				eq(adminAccounts.isActive, true)
			)
		)
		.limit(1);
	return result[0] ?? null;
}

export async function setImpersonation(
	sessionId: string,
	orgId: string | null
): Promise<void> {
	await db
		.update(sessions)
		.set({ impersonatingOrgId: orgId })
		.where(eq(sessions.id, sessionId));
}
