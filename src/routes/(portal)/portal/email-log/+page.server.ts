import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { listEmailLogs, revokeEmail } from '$lib/server/services/email-log';
import { isEnabled } from '$lib/feature-flags';

export const load: PageServerLoad = async ({ parent, url }) => {
	if (!isEnabled('portalEmailLog')) error(404, 'Not found');
	const { organization } = await parent();
	const page = parseInt(url.searchParams.get('page') ?? '1', 10);
	const search = url.searchParams.get('search') ?? undefined;

	const result = await listEmailLogs(organization.id, page, search);
	return { emailLogs: result, search: search ?? '' };
};

export const actions: Actions = {
	revoke: async ({ request, parent, locals }) => {
		const { organization } = await parent();
		const data = await request.formData();
		const emailId = data.get('emailId')?.toString();

		if (!emailId) return fail(400, { error: 'Missing email ID' });

		await revokeEmail(emailId, organization.id, locals.session?.id ?? 'unknown');
		return { revoked: true };
	}
};
