import type { LayoutServerLoad } from './$types';
import { isEnabled } from '$lib/feature-flags';
import { ATTR } from '$lib/server/auth/yivi';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = locals.session;
	const auth = session
		? {
				loggedIn: true as const,
				email: session.yiviAttributes?.[ATTR.email] ?? null,
				portalHref:
					session.userType === 'admin' ? '/admin/organizations' : '/portal/dashboard'
			}
		: { loggedIn: false as const, email: null, portalHref: '/portal/dashboard' };

	return {
		marketingFlags: {
			pricing: isEnabled('pricingPage'),
			registration: isEnabled('registration')
		},
		auth
	};
};
