import type { PageServerLoad } from './$types';
import { getAllFlags, canToggleFlags, FLAG_LABELS } from '$lib/feature-flags';

export const load: PageServerLoad = async () => {
	return {
		flags: getAllFlags(),
		labels: FLAG_LABELS,
		canToggle: canToggleFlags
	};
};
