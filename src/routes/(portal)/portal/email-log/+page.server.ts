import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { listEmailLogs, revokeEmail } from '$lib/server/services/email-log';

export const load: PageServerLoad = async ({ parent, url }) => {
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
