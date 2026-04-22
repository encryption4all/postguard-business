import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { isEnabled } from '$lib/feature-flags';
import { listOrgUsers, addUser, removeUser, setContactPerson } from '$lib/server/services/users';

export const load: PageServerLoad = async ({ parent }) => {
	if (!isEnabled('portalMembers')) error(404, 'Not found');
	const { organization } = await parent();
	const members = await listOrgUsers(organization.id);
	return { members };
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		const orgId = locals.session?.impersonatingOrgId ?? locals.session?.orgId;
		if (!orgId) error(401, 'Not authenticated');

		const data = await request.formData();
		const email = data.get('email')?.toString().trim().toLowerCase();
		const fullName = data.get('fullName')?.toString().trim();
		const phone = data.get('phone')?.toString().trim() || null;

		if (!email || !fullName) {
			return fail(400, { error: 'Email and full name are required' });
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { error: 'Invalid email address' });
		}

		try {
			await addUser(orgId, email, fullName, phone);
		} catch (err: unknown) {
			if (err instanceof Error && err.message.includes('unique')) {
				return fail(409, { error: 'A user with this email already exists' });
			}
			throw err;
		}

		return { added: true };
	},

	remove: async ({ request, locals }) => {
		const orgId = locals.session?.impersonatingOrgId ?? locals.session?.orgId;
		if (!orgId) error(401, 'Not authenticated');

		const data = await request.formData();
		const userId = data.get('userId')?.toString();
		if (!userId) return fail(400, { error: 'Missing user ID' });

		try {
			await removeUser(userId, orgId);
		} catch (err: unknown) {
			if (err instanceof Error) {
				return fail(400, { error: err.message });
			}
			throw err;
		}

		return { removed: true };
	},

	setContact: async ({ request, locals }) => {
		const orgId = locals.session?.impersonatingOrgId ?? locals.session?.orgId;
		if (!orgId) error(401, 'Not authenticated');

		const data = await request.formData();
		const userId = data.get('userId')?.toString();
		if (!userId) return fail(400, { error: 'Missing user ID' });

		try {
			await setContactPerson(orgId, userId);
		} catch (err: unknown) {
			if (err instanceof Error) {
				return fail(400, { error: err.message });
			}
			throw err;
		}

		return { contactChanged: true };
	}
};
