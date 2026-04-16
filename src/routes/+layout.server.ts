import type { LayoutServerLoad } from './$types';
import { ATTR } from '$lib/server/auth/yivi';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		session: locals.session,
		yiviAttrs: {
			email: ATTR.email,
			fullName: ATTR.fullName,
			phone: ATTR.phone
		}
	};
};
