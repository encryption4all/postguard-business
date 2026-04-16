import type { Actions, PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import {
	getOrCreateDnsVerification,
	verifyDns
} from '$lib/server/services/dns-verification';
import { isEnabled } from '$lib/feature-flags';

export const load: PageServerLoad = async ({ parent }) => {
	if (!isEnabled('portalDns')) error(404, 'Not found');
	const { organization } = await parent();
	const dns = await getOrCreateDnsVerification(organization.id, organization.domain);
	return { dns };
};

export const actions: Actions = {
	verify: async ({ locals }) => {
		const orgId = locals.session?.orgId;
		if (!orgId) error(401, 'Not authenticated');
		const result = await verifyDns(orgId);
		return result;
	}
};
