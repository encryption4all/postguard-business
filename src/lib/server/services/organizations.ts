import { db } from '$lib/server/db';
import { changeRequests } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function createChangeRequest(
	orgId: string,
	fieldName: string,
	oldValue: string | null,
	newValue: string
) {
	await db.insert(changeRequests).values({
		orgId,
		fieldName,
		oldValue,
		newValue
	});
}

export async function listChangeRequests(orgId: string) {
	return db
		.select()
		.from(changeRequests)
		.where(eq(changeRequests.orgId, orgId))
		.orderBy(desc(changeRequests.requestedAt));
}

export async function listPendingChangeRequests(orgId: string) {
	return db
		.select()
		.from(changeRequests)
		.where(and(eq(changeRequests.orgId, orgId), eq(changeRequests.status, 'pending')))
		.orderBy(desc(changeRequests.requestedAt));
}
