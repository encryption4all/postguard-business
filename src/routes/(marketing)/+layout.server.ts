import type { LayoutServerLoad } from './$types';
import { isEnabled } from '$lib/feature-flags';

export const load: LayoutServerLoad = async () => {
	return {
		marketingFlags: {
			pricing: isEnabled('pricingPage'),
			registration: isEnabled('registration')
		}
	};
};
