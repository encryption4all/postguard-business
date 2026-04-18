import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.session?.userType === 'org') {
		redirect(303, url.searchParams.get('redirect') ?? '/portal/dashboard');
	}
};
