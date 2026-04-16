import type { Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createApiKey } from '$lib/server/services/api-keys';
import { isEnabled } from '$lib/feature-flags';

export function load() {
	if (!isEnabled('portalApiKeys')) error(404, 'Not found');
}

export const actions: Actions = {
	default: async ({ request, parent }) => {
		const { organization } = await parent();
		const data = await request.formData();

		const name = data.get('name')?.toString().trim();
		const expiryDays = parseInt(data.get('expiryDays')?.toString() ?? '365', 10);
		const signOrgName = data.get('signOrgName') === 'on';
		const signPhone = data.get('signPhone') === 'on';
		const signKvkNumber = data.get('signKvkNumber') === 'on';
		const signEmail = data.get('signEmail') === 'on';

		if (!name) {
			return fail(400, { error: 'Name is required', values: { name } });
		}

		if (!signOrgName && !signPhone && !signKvkNumber && !signEmail) {
			return fail(400, {
				error: 'Select at least one signing attribute',
				values: { name }
			});
		}

		const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

		const rawKey = await createApiKey(
			organization.id,
			name,
			{
				orgName: signOrgName,
				phone: signPhone,
				kvkNumber: signKvkNumber,
				email: signEmail
			},
			expiresAt
		);

		return { success: true, rawKey };
	}
};
