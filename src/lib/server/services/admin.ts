import { db } from '$lib/server/db';
import {
	organizations,
	users,
	changeRequests,
	adminAuditLog,
	apiKeys,
	adminAccounts,
	sessions
} from '$lib/server/db/schema';
import { eq, desc, and, isNull, or, count, sql } from 'drizzle-orm';

export async function logAdminAction(
	adminId: string,
	action: string,
	targetType: string | null,
	targetId: string | null,
	details: Record<string, unknown>,
	ipAddress: string | null
) {
	await db.insert(adminAuditLog).values({
		adminId,
		action,
		targetType,
		targetId,
		details,
		ipAddress
	});
}

export async function listOrganizations() {
	return db.select().from(organizations).orderBy(desc(organizations.createdAt));
}

export async function listPendingRequests() {
	const results = await db
		.select({
			request: changeRequests,
			orgName: organizations.name,
			orgDomain: organizations.domain
		})
		.from(changeRequests)
		.innerJoin(organizations, eq(changeRequests.orgId, organizations.id))
		.where(eq(changeRequests.status, 'pending'))
		.orderBy(desc(changeRequests.requestedAt));

	return results;
}

export async function getOrganizationWithRequests(orgId: string) {
	const orgs = await db
		.select()
		.from(organizations)
		.where(eq(organizations.id, orgId))
		.limit(1);

	if (!orgs[0]) return null;

	const requests = await db
		.select()
		.from(changeRequests)
		.where(eq(changeRequests.orgId, orgId))
		.orderBy(desc(changeRequests.requestedAt));

	const orgUsers = await db
		.select()
		.from(users)
		.where(eq(users.orgId, orgId))
		.orderBy(users.fullName);

	// Load contact person if set
	let contactPerson = null;
	if (orgs[0].contactUserId) {
		contactPerson = orgUsers.find((u) => u.id === orgs[0].contactUserId) ?? null;
	}

	return { organization: orgs[0], requests, contactPerson, users: orgUsers };
}

export async function approveChangeRequest(
	requestId: string,
	adminId: string,
	reviewNotes: string
) {
	const reqs = await db
		.select()
		.from(changeRequests)
		.where(eq(changeRequests.id, requestId))
		.limit(1);

	if (!reqs[0]) return null;
	const req = reqs[0];

	// Apply the change to the organization
	const updateData: Record<string, string> = {};
	const fieldMap: Record<string, string> = {
		name: 'name',
		domain: 'domain',
		signingEmail: 'signing_email',
		kvkNumber: 'kvk_number'
	};

	if (fieldMap[req.fieldName]) {
		// Use raw SQL for dynamic column update
		await db.execute(sql`UPDATE organizations SET ${sql.raw(fieldMap[req.fieldName])} = ${req.newValue}, updated_at = NOW() WHERE id = ${req.orgId}`);
	}

	await db
		.update(changeRequests)
		.set({
			status: 'approved',
			reviewedAt: new Date(),
			reviewedBy: adminId,
			reviewNotes
		})
		.where(eq(changeRequests.id, requestId));

	return req;
}

export async function rejectChangeRequest(
	requestId: string,
	adminId: string,
	reviewNotes: string
) {
	await db
		.update(changeRequests)
		.set({
			status: 'rejected',
			reviewedAt: new Date(),
			reviewedBy: adminId,
			reviewNotes
		})
		.where(eq(changeRequests.id, requestId));
}

export async function activateOrganization(orgId: string) {
	await db
		.update(organizations)
		.set({ status: 'active', updatedAt: new Date() })
		.where(eq(organizations.id, orgId));
}

export async function suspendOrganization(orgId: string) {
	await db
		.update(organizations)
		.set({ status: 'suspended', updatedAt: new Date() })
		.where(eq(organizations.id, orgId));
}

export async function getOrganizationById(orgId: string) {
	const rows = await db
		.select()
		.from(organizations)
		.where(eq(organizations.id, orgId))
		.limit(1);
	return rows[0] ?? null;
}

export async function deleteOrganization(orgId: string) {
	await db
		.delete(sessions)
		.where(or(eq(sessions.orgId, orgId), eq(sessions.impersonatingOrgId, orgId)));
	await db.delete(organizations).where(eq(organizations.id, orgId));
}

export async function createOrganization(input: {
	name: string;
	domain: string;
	signingEmail: string;
	kvkNumber: string | null;
	status: 'active' | 'pending' | 'suspended';
}) {
	const [org] = await db
		.insert(organizations)
		.values({
			name: input.name,
			domain: input.domain,
			signingEmail: input.signingEmail,
			kvkNumber: input.kvkNumber,
			status: input.status
		})
		.returning();
	return org;
}

export async function addUserToOrganization(
	orgId: string,
	input: { email: string; fullName: string; phone: string | null }
) {
	const [user] = await db
		.insert(users)
		.values({
			email: input.email,
			fullName: input.fullName,
			phone: input.phone,
			orgId
		})
		.returning();
	return user;
}

export async function listAdminAuditLog(page: number = 1) {
	const pageSize = 50;
	const offset = (page - 1) * pageSize;

	const [totalResult] = await db.select({ count: count() }).from(adminAuditLog);

	const logs = await db
		.select({
			log: adminAuditLog,
			adminName: adminAccounts.fullName,
			adminEmail: adminAccounts.email
		})
		.from(adminAuditLog)
		.innerJoin(adminAccounts, eq(adminAuditLog.adminId, adminAccounts.id))
		.orderBy(desc(adminAuditLog.createdAt))
		.limit(pageSize)
		.offset(offset);

	return {
		logs,
		total: totalResult.count,
		page,
		pageSize,
		totalPages: Math.ceil(totalResult.count / pageSize)
	};
}

export async function listAllApiKeys() {
	return db
		.select({
			key: apiKeys,
			orgName: organizations.name,
			orgDomain: organizations.domain
		})
		.from(apiKeys)
		.innerJoin(organizations, eq(apiKeys.orgId, organizations.id))
		.where(isNull(apiKeys.revokedAt))
		.orderBy(desc(apiKeys.createdAt));
}

export async function adminRevokeApiKey(keyId: string) {
	await db
		.update(apiKeys)
		.set({ revokedAt: new Date() })
		.where(and(eq(apiKeys.id, keyId), isNull(apiKeys.revokedAt)));
}
