import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { createChangeRequest, listChangeRequests } from '$lib/server/services/organizations';
import { isEnabled } from '$lib/feature-flags';

export const load: PageServerLoad = async ({ parent }) => {
	if (!isEnabled('portalOrgInfo')) error(404, 'Not found');
	const { organization } = await parent();
	const requests = await listChangeRequests(organization.id);
	return { requests };
};

export const actions: Actions = {
	requestChange: async ({ request, parent }) => {
		const { organization } = await parent();
		const data = await request.formData();
		const fieldName = data.get('fieldName')?.toString();
		const newValue = data.get('newValue')?.toString().trim();
		const oldValue = data.get('oldValue')?.toString() || null;

		if (!fieldName || !newValue) {
			return fail(400, { error: 'Field name and new value are required' });
		}

		await createChangeRequest(organization.id, fieldName, oldValue, newValue);
		return { submitted: true, fieldName };
	}
};
