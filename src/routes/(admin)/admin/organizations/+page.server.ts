import type { Actions, PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import {
	listOrganizations,
	listPendingRequests,
	activateOrganization,
	suspendOrganization,
	logAdminAction
} from '$lib/server/services/admin';
import { isEnabled } from '$lib/feature-flags';

export const load: PageServerLoad = async () => {
	if (!isEnabled('adminPanel')) error(404, 'Not found');
	const [orgs, pendingRequests] = await Promise.all([
		listOrganizations(),
		listPendingRequests()
	]);

	return { organizations: orgs, pendingRequests };
};

export const actions: Actions = {
	activate: async ({ request, parent, locals, getClientAddress }) => {
		const { admin } = await parent();
		const data = await request.formData();
		const orgId = data.get('orgId')?.toString();
		if (!orgId) return;

		await activateOrganization(orgId);
		await logAdminAction(admin.id, 'activate_org', 'organization', orgId, {}, getClientAddress());
	},
	suspend: async ({ request, parent, locals, getClientAddress }) => {
		const { admin } = await parent();
		const data = await request.formData();
		const orgId = data.get('orgId')?.toString();
		if (!orgId) return;

		await suspendOrganization(orgId);
		await logAdminAction(admin.id, 'suspend_org', 'organization', orgId, {}, getClientAddress());
	}
};
