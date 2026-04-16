import { json, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import {
	getAllFlags,
	setFlag,
	resetFlag,
	canToggleFlags,
	type FeatureFlag,
	FLAG_LABELS
} from '$lib/feature-flags';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.session || locals.session.userType !== 'admin') {
		error(403, 'Forbidden');
	}
	return json({
		flags: getAllFlags(),
		labels: FLAG_LABELS,
		canToggle: canToggleFlags
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.session || locals.session.userType !== 'admin') {
		error(403, 'Forbidden');
	}
	if (!dev) {
		error(403, 'Feature flags cannot be changed in production');
	}

	const { flag, value } = (await request.json()) as { flag: string; value: boolean | null };

	if (!(flag in FLAG_LABELS)) {
		error(400, 'Unknown flag');
	}

	if (value === null) {
		resetFlag(flag as FeatureFlag);
	} else {
		setFlag(flag as FeatureFlag, value);
	}

	return json({ flags: getAllFlags(), labels: FLAG_LABELS, canToggle: canToggleFlags });
};
