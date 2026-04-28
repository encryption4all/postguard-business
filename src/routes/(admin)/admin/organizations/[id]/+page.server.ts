import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import {
	getOrganizationWithRequests,
	approveChangeRequest,
	rejectChangeRequest,
	deleteOrganization,
	activateOrganization,
	suspendOrganization,
	logAdminAction
} from '$lib/server/services/admin';
import { setImpersonation } from '$lib/server/auth/session';
import { isEnabled } from '$lib/feature-flags';

export const load: PageServerLoad = async ({ params }) => {
	if (!isEnabled('adminPanel')) error(404, 'Not found');
	const result = await getOrganizationWithRequests(params.id);
	if (!result) error(404, 'Organization not found');
	return {
		...result,
		impersonationEnabled: isEnabled('adminImpersonation'),
		orgStatusEnabled: isEnabled('adminOrgStatus')
	};
};

export const actions: Actions = {
	approve: async ({ request, locals }) => {
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');
		const data = await request.formData();
		const requestId = data.get('requestId')?.toString();
		const reviewNotes = data.get('reviewNotes')?.toString() ?? '';

		if (!requestId) return fail(400, { error: 'Missing request ID' });

		const req = await approveChangeRequest(requestId, adminId, reviewNotes);
		if (req) {
			await logAdminAction(
				adminId,
				'approve_change',
				'change_request',
				requestId,
				{ fieldName: req.fieldName, newValue: req.newValue, reviewNotes },
				null
			);
		}
		return { approved: true };
	},

	reject: async ({ request, locals }) => {
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');
		const data = await request.formData();
		const requestId = data.get('requestId')?.toString();
		const reviewNotes = data.get('reviewNotes')?.toString() ?? '';

		if (!requestId) return fail(400, { error: 'Missing request ID' });

		await rejectChangeRequest(requestId, adminId, reviewNotes);
		await logAdminAction(
			adminId,
			'reject_change',
			'change_request',
			requestId,
			{ reviewNotes },
			null
		);
		return { rejected: true };
	},

	impersonate: async ({ params, locals }) => {
		if (!isEnabled('adminImpersonation')) return fail(404);
		if (!locals.session) return fail(401);
		await setImpersonation(locals.session.id, params.id);
		redirect(303, '/portal/dashboard');
	},

	activate: async ({ params, locals }) => {
		if (!isEnabled('adminOrgStatus')) return fail(404);
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');
		await activateOrganization(params.id);
		await logAdminAction(adminId, 'activate_org', 'organization', params.id, {}, null);
		return { statusChanged: 'active' };
	},

	suspend: async ({ params, locals }) => {
		if (!isEnabled('adminOrgStatus')) return fail(404);
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');
		await suspendOrganization(params.id);
		await logAdminAction(adminId, 'suspend_org', 'organization', params.id, {}, null);
		return { statusChanged: 'suspended' };
	},

	delete: async ({ params, request, locals }) => {
		if (!isEnabled('adminOrgStatus')) return fail(404);
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');
		const data = await request.formData();
		const confirmName = data.get('confirmName')?.toString() ?? '';

		const result = await getOrganizationWithRequests(params.id);
		if (!result) error(404, 'Organization not found');

		if (confirmName.trim() !== result.organization.name.trim()) {
			return fail(400, { error: 'name_mismatch' });
		}

		await deleteOrganization(params.id);
		await logAdminAction(
			adminId,
			'delete_org',
			'organization',
			params.id,
			{ name: result.organization.name, domain: result.organization.domain },
			null
		);
		redirect(303, `/admin/organizations?deleted=${encodeURIComponent(result.organization.name)}`);
	}
};
