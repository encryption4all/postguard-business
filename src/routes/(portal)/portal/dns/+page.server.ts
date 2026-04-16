import type { Actions, PageServerLoad } from './$types';
import {
	getOrCreateDnsVerification,
	verifyDns
} from '$lib/server/services/dns-verification';

export const load: PageServerLoad = async ({ parent }) => {
	const { organization } = await parent();
	const dns = await getOrCreateDnsVerification(organization.id, organization.domain);
	return { dns };
};

export const actions: Actions = {
	verify: async ({ parent }) => {
		const { organization } = await parent();
		const result = await verifyDns(organization.id);
		return result;
	}
};
