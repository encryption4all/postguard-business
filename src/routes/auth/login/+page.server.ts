import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { safeRedirect } from './safe-redirect';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.session?.userType === 'org') {
		redirect(303, safeRedirect(url.searchParams.get('redirect')));
	}
};
