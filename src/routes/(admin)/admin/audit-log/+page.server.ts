import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listAdminAuditLog } from '$lib/server/services/admin';
import { isEnabled } from '$lib/feature-flags';

export const load: PageServerLoad = async ({ url }) => {
	if (!isEnabled('adminPanel') || !isEnabled('adminAuditLog')) error(404, 'Not found');
	const page = parseInt(url.searchParams.get('page') ?? '1', 10);
	const result = await listAdminAuditLog(page);
	return { auditLog: result };
};
