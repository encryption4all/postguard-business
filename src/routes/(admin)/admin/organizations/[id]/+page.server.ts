import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import {
	getOrganizationWithRequests,
	approveChangeRequest,
	rejectChangeRequest,
	logAdminAction
} from '$lib/server/services/admin';
import { setImpersonation } from '$lib/server/auth/session';
import { isEnabled } from '$lib/feature-flags';

export const load: PageServerLoad = async ({ params }) => {
	const result = await getOrganizationWithRequests(params.id);
	if (!result) error(404, 'Organization not found');
	return { ...result, impersonationEnabled: isEnabled('adminImpersonation') };
};

export const actions: Actions = {
	approve: async ({ request, parent, locals, getClientAddress }) => {
		const { admin } = await parent();
		const data = await request.formData();
		const requestId = data.get('requestId')?.toString();
		const reviewNotes = data.get('reviewNotes')?.toString() ?? '';

		if (!requestId) return fail(400, { error: 'Missing request ID' });

		const req = await approveChangeRequest(requestId, admin.id, reviewNotes);
		if (req) {
			await logAdminAction(
				admin.id,
				'approve_change',
				'change_request',
				requestId,
				{ fieldName: req.fieldName, newValue: req.newValue, reviewNotes },
				getClientAddress()
			);
		}
		return { approved: true };
	},

	reject: async ({ request, parent, locals, getClientAddress }) => {
		const { admin } = await parent();
		const data = await request.formData();
		const requestId = data.get('requestId')?.toString();
		const reviewNotes = data.get('reviewNotes')?.toString() ?? '';

		if (!requestId) return fail(400, { error: 'Missing request ID' });

		await rejectChangeRequest(requestId, admin.id, reviewNotes);
		await logAdminAction(
			admin.id,
			'reject_change',
			'change_request',
			requestId,
			{ reviewNotes },
			getClientAddress()
		);
		return { rejected: true };
	},

	impersonate: async ({ params, parent, locals }) => {
		if (!isEnabled('adminImpersonation')) return fail(404);
		if (!locals.session) return fail(401);
		await setImpersonation(locals.session.id, params.id);
		return { impersonating: true };
	}
};
