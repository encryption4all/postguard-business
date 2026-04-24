import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { createChangeRequest, listChangeRequests } from '$lib/server/services/organizations';
import { isEnabled } from '$lib/feature-flags';

// Fields a portal user may request changes to. Must stay in sync with the
// editable entries in the corresponding +page.svelte.
const CHANGEABLE_FIELDS = ['name', 'domain', 'signingEmail', 'kvkNumber'] as const;
type ChangeableField = (typeof CHANGEABLE_FIELDS)[number];

function isChangeableField(value: string): value is ChangeableField {
	return (CHANGEABLE_FIELDS as readonly string[]).includes(value);
}

export const load: PageServerLoad = async ({ parent }) => {
	if (!isEnabled('portalOrgInfo')) error(404, 'Not found');
	const { organization } = await parent();
	const requests = await listChangeRequests(organization.id);
	return { requests };
};

export const actions: Actions = {
	requestChange: async ({ request, locals }) => {
		const orgId = locals.session?.impersonatingOrgId ?? locals.session?.orgId;
		if (!orgId) error(401, 'Not authenticated');
		const data = await request.formData();
		const fieldName = data.get('fieldName')?.toString();
		const newValue = data.get('newValue')?.toString().trim();
		const oldValue = data.get('oldValue')?.toString() || null;

		if (!fieldName || !newValue) {
			return fail(400, { error: 'Field name and new value are required' });
		}

		if (!isChangeableField(fieldName)) {
			return fail(400, { error: 'Invalid field name' });
		}

		await createChangeRequest(orgId, fieldName, oldValue, newValue);
		return { submitted: true, fieldName };
	}
};
