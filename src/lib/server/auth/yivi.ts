import { env } from '$env/dynamic/private';

const YIVI_SERVER_URL = env.YIVI_SERVER_URL ?? 'http://localhost:8088';
const USE_DEMO_ATTRS = env.YIVI_DEMO_ATTRIBUTES === 'true';

// Production attributes (pbdf scheme)
const PROD_ATTR = {
	email: 'pbdf.sidn-pbdf.email.email',
	fullName: 'pbdf.gemeente.personalData.fullname',
	phone: 'pbdf.sidn-pbdf.mobilenumber.mobilenumber'
} as const;

// Demo attributes (irma-demo scheme) — anyone can load these in the Yivi app
const DEMO_ATTR = {
	email: 'irma-demo.sidn-pbdf.email.email',
	fullName: 'irma-demo.gemeente.personalData.fullname',
	phone: 'irma-demo.sidn-pbdf.mobilenumber.mobilenumber'
} as const;

export const ATTR = USE_DEMO_ATTRS ? DEMO_ATTR : PROD_ATTR;

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
