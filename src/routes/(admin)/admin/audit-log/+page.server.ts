import type { PageServerLoad } from './$types';
import { listAdminAuditLog } from '$lib/server/services/admin';

export const load: PageServerLoad = async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') ?? '1', 10);
	const result = await listAdminAuditLog(page);
	return { auditLog: result };
};
