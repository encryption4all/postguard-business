import { env } from '$env/dynamic/private';

const YIVI_SERVER_URL = env.YIVI_SERVER_URL ?? 'http://localhost:8088';

// Attribute identifiers used in Yivi/IRMA
export const ATTR = {
	email: 'pbdf.sidn-pbdf.email.email',
	fullName: 'pbdf.gemeente.personalData.fullname',
	phone: 'pbdf.sidn-pbdf.mobilenumber.mobilenumber'
} as const;

interface YiviSessionResult {
	proofStatus: string;
	disclosed: Array<Array<{ id: string; rawvalue: string }>>;
}

/**
 * Verify a completed Yivi session by fetching the result from the IRMA server.
 * Called after the Yivi frontend SDK completes the disclosure flow.
 */
export async function verifyYiviSession(irmaSessionToken: string): Promise<{
	valid: boolean;
	attributes: Record<string, string>;
}> {
	const response = await fetch(`${YIVI_SERVER_URL}/session/${irmaSessionToken}/result`, {
		method: 'GET'
	});

	if (!response.ok) {
		return { valid: false, attributes: {} };
	}

	const result: YiviSessionResult = await response.json();

	if (result.proofStatus !== 'VALID') {
		return { valid: false, attributes: {} };
	}

	const attributes: Record<string, string> = {};
	for (const discon of result.disclosed) {
		for (const attr of discon) {
			if (attr.id === ATTR.email) attributes.email = attr.rawvalue;
			else if (attr.id === ATTR.fullName) attributes.fullName = attr.rawvalue;
			else if (attr.id === ATTR.phone) attributes.phone = attr.rawvalue;
		}
	}

	return { valid: true, attributes };
}
