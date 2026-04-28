import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { listAllApiKeys, adminRevokeApiKey, logAdminAction } from '$lib/server/services/admin';
import { createApiKey } from '$lib/server/services/api-keys';
import { isEnabled } from '$lib/feature-flags';

export const load: PageServerLoad = async () => {
	if (!isEnabled('adminPanel')) error(404, 'Not found');
	const keys = await listAllApiKeys();
	return { keys };
};

export const actions: Actions = {
	revoke: async ({ request, locals, getClientAddress }) => {
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');
		const data = await request.formData();
		const keyId = data.get('keyId')?.toString();

		if (!keyId) return fail(400);

		await adminRevokeApiKey(keyId);
		await logAdminAction(adminId, 'revoke_key', 'api_key', keyId, {}, getClientAddress());
		return { revoked: true };
	},

	create: async ({ request, locals, getClientAddress }) => {
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');
		const data = await request.formData();
		const orgId = data.get('orgId')?.toString();
		const name = data.get('name')?.toString().trim();

		if (!orgId || !name) return fail(400, { error: 'Organization and name required' });

		const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
		const rawKey = await createApiKey(
			orgId,
			name,
			{ orgName: true, phone: false, kvkNumber: false, email: true },
			expiresAt
		);

		await logAdminAction(
			adminId,
			'create_key',
			'api_key',
			null,
			{ orgId, name },
			getClientAddress()
		);

		return { created: true, rawKey };
	}
};
