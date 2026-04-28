import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import {
	getOrganizationWithRequests,
	getOrganizationById,
	approveChangeRequest,
	rejectChangeRequest,
	deleteOrganization,
	activateOrganization,
	suspendOrganization,
	addUserToOrganization,
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
	approve: async ({ request, locals, getClientAddress }) => {
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
				getClientAddress()
			);
		}
		return { approved: true };
	},

	reject: async ({ request, locals, getClientAddress }) => {
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
			getClientAddress()
		);
		return { rejected: true };
	},

	impersonate: async ({ params, locals }) => {
		if (!isEnabled('adminImpersonation')) return fail(404);
		if (!locals.session) return fail(401);
		await setImpersonation(locals.session.id, params.id);
		redirect(303, '/portal/dashboard');
	},

	activate: async ({ params, locals, getClientAddress }) => {
		if (!isEnabled('adminOrgStatus')) return fail(404);
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');
		const org = await getOrganizationById(params.id);
		if (!org) error(404, 'Organization not found');

		await activateOrganization(params.id);
		await logAdminAction(
			adminId,
			'activate_org',
			'organization',
			params.id,
			{ name: org.name, domain: org.domain, previousStatus: org.status },
			getClientAddress()
		);
		return { statusChanged: 'active' };
	},

	suspend: async ({ params, locals, getClientAddress }) => {
		if (!isEnabled('adminOrgStatus')) return fail(404);
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');
		const org = await getOrganizationById(params.id);
		if (!org) error(404, 'Organization not found');

		await suspendOrganization(params.id);
		await logAdminAction(
			adminId,
			'suspend_org',
			'organization',
			params.id,
			{ name: org.name, domain: org.domain, previousStatus: org.status },
			getClientAddress()
		);
		return { statusChanged: 'suspended' };
	},

	delete: async ({ params, request, locals, getClientAddress }) => {
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
			getClientAddress()
		);
		redirect(303, `/admin/organizations?deleted=${encodeURIComponent(result.organization.name)}`);
	},

	addUser: async ({ params, request, locals, getClientAddress }) => {
		if (!isEnabled('adminOrgStatus')) return fail(404);
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');

		const data = await request.formData();
		const email = (data.get('email') ?? '').toString().trim().toLowerCase();
		const fullName = (data.get('fullName') ?? '').toString().trim();
		const phone = ((data.get('phone') ?? '').toString().trim() || null) as string | null;

		const errors: Record<string, string> = {};
		if (!fullName) errors.fullName = 'addUser_required_name';
		if (!email) errors.email = 'addUser_required_email';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'addUser_invalid_email';

		if (Object.keys(errors).length > 0) {
			return fail(400, {
				addUserErrors: errors,
				addUserValues: { email, fullName, phone }
			});
		}

		const org = await getOrganizationById(params.id);
		if (!org) error(404, 'Organization not found');

		try {
			const user = await addUserToOrganization(params.id, { email, fullName, phone });
			await logAdminAction(
				adminId,
				'add_user',
				'user',
				user.id,
				{ orgId: params.id, orgName: org.name, email, fullName },
				getClientAddress()
			);
			return { userAdded: true, addedUserName: fullName };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : '';
			const cause = (err as { cause?: { message?: string } })?.cause?.message ?? '';
			if (`${msg}\n${cause}`.match(/duplicate key|unique/i)) {
				return fail(409, {
					addUserErrors: { email: 'addUser_duplicate_email' } as Record<string, string>,
					addUserValues: { email, fullName, phone }
				});
			}
			return fail(500, {
				addUserErrors: { form: 'addUser_unexpected' } as Record<string, string>,
				addUserValues: { email, fullName, phone }
			});
		}
	}
};
