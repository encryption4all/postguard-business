import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { listApiKeys, revokeApiKey } from '$lib/server/services/api-keys';
import { isEnabled } from '$lib/feature-flags';

export const load: PageServerLoad = async ({ parent }) => {
	if (!isEnabled('portalApiKeys')) error(404, 'Not found');
	const { organization } = await parent();
	const keys = await listApiKeys(organization.id);
	return { keys };
};

export const actions: Actions = {
	revoke: async ({ request, parent }) => {
		const { organization } = await parent();
		const data = await request.formData();
		const keyId = data.get('keyId')?.toString();

		if (!keyId) {
			return fail(400, { error: 'Missing key ID' });
		}

		await revokeApiKey(keyId, organization.id);
		return { revoked: true };
	}
};
