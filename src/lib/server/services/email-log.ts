import { db } from '$lib/server/db';
import { emailAuditLog } from '$lib/server/db/schema';
import { eq, and, desc, isNull, count, like, or } from 'drizzle-orm';

const PAGE_SIZE = 25;

export async function listEmailLogs(orgId: string, page: number = 1, search?: string) {
	const offset = (page - 1) * PAGE_SIZE;

	let whereClause = eq(emailAuditLog.orgId, orgId);

	if (search) {
		whereClause = and(
			whereClause,
			or(
				like(emailAuditLog.recipient, `%${search}%`),
				like(emailAuditLog.subject, `%${search}%`)
			)
		)!;
	}

	const [totalResult] = await db
		.select({ count: count() })
		.from(emailAuditLog)
		.where(whereClause);

	const logs = await db
		.select()
		.from(emailAuditLog)
		.where(whereClause)
		.orderBy(desc(emailAuditLog.signedAt))
		.limit(PAGE_SIZE)
		.offset(offset);

	return {
		logs,
		total: totalResult.count,
		page,
		pageSize: PAGE_SIZE,
		totalPages: Math.ceil(totalResult.count / PAGE_SIZE)
	};
}

export async function revokeEmail(emailId: string, orgId: string, revokedBy: string) {
	await db
		.update(emailAuditLog)
		.set({ revokedAt: new Date(), revokedBy })
		.where(
			and(
				eq(emailAuditLog.id, emailId),
				eq(emailAuditLog.orgId, orgId),
				isNull(emailAuditLog.revokedAt)
			)
		);
}
