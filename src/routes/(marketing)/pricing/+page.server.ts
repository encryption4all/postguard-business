import { error } from '@sveltejs/kit';
import { isEnabled } from '$lib/feature-flags';

export function load() {
	if (!isEnabled('pricingPage')) error(404, 'Not found');
}
