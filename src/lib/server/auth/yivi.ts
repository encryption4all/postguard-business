import { env } from '$env/dynamic/private';

const YIVI_SERVER_URL = env.YIVI_SERVER_URL ?? 'http://localhost:8088';

interface YiviSessionResult {
	proofStatus: string;
	disclosed: Array<Array<{ id: string; rawvalue: string }>>;
}

// Attribute identifiers used in Yivi/IRMA
const ATTR = {
	email: 'pbdf.sidn-pbdf.email.email',
	fullName: 'pbdf.gemeente.personalData.fullname',
	phone: 'pbdf.sidn-pbdf.mobilenumber.mobilenumber'
} as const;

export interface YiviDisclosureRequest {
	type: 'org' | 'admin';
}

export async function startYiviSession(type: 'org' | 'admin'): Promise<{ sessionPtr: unknown; token: string }> {
	const discon =
		type === 'admin'
			? [[{ t: ATTR.email }, { t: ATTR.fullName }, { t: ATTR.phone }]]
			: [[{ t: ATTR.email }]];

	const response = await fetch(`${YIVI_SERVER_URL}/session`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			'@context': 'https://irma.app/ld/request/disclosure/v2',
			disclose: discon
		})
	});

	if (!response.ok) {
		throw new Error(`Failed to start Yivi session: ${response.status}`);
	}

	return response.json();
}

export async function getYiviSessionResult(token: string): Promise<{
	valid: boolean;
	attributes: Record<string, string>;
}> {
	const response = await fetch(`${YIVI_SERVER_URL}/session/${token}/result`, {
		method: 'GET'
	});

	if (!response.ok) {
		throw new Error(`Failed to get Yivi result: ${response.status}`);
	}

	const result: YiviSessionResult = await response.json();

	if (result.proofStatus !== 'VALID') {
		return { valid: false, attributes: {} };
	}

	const attributes: Record<string, string> = {};
	for (const discon of result.disclosed) {
		for (const attr of discon) {
			// Map full attribute ID to short key
			if (attr.id === ATTR.email) attributes.email = attr.rawvalue;
			else if (attr.id === ATTR.fullName) attributes.fullName = attr.rawvalue;
			else if (attr.id === ATTR.phone) attributes.phone = attr.rawvalue;
		}
	}

	return { valid: true, attributes };
}
