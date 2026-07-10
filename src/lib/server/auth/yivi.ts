import { config } from '$lib/server/config';

export const YIVI_SERVER_URL = config.YIVI_SERVER_URL;
export const YIVI_SERVER_TOKEN = config.YIVI_SERVER_TOKEN;
const USE_DEMO_ATTRS = config.YIVI_DEMO_ATTRIBUTES;

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

const DISCLOSURE_CONTEXT = 'https://irma.app/ld/request/disclosure/v2';

/**
 * The distinct disclosure flows the app initiates. Each maps to a *fixed*,
 * server-defined set of attributes — the client never gets to choose what is
 * disclosed or what kind of IRMA session is created.
 */
export type YiviDisclosurePurpose = 'login-org' | 'login-admin' | 'register';

/** HttpOnly cookie that binds the privileged requestor token to the browser. */
export const YIVI_RT_COOKIE = 'pg_yivi_rt';
/** Scope the requestor-token cookie to the Yivi API routes only. */
export const YIVI_RT_COOKIE_PATH = '/api/auth/yivi';

// A disclosure request is `disclose: [ [ [attribute] ] ]` (outer = AND of
// conjunctions, middle = OR of options, inner = attribute identifiers).
function discloseFor(purpose: YiviDisclosurePurpose): string[][][] {
	switch (purpose) {
		case 'login-org':
			// Org login only needs to prove the account email.
			return [[[ATTR.email]]];
		case 'login-admin':
		case 'register':
			return [[[ATTR.email]], [[ATTR.fullName]], [[ATTR.phone]]];
	}
}

interface YiviSessionPackage {
	sessionPtr: unknown;
	frontendRequest: unknown;
	/** The requestor token — MUST stay server-side. */
	token: string;
}

/**
 * Create a Yivi disclosure session on the IRMA server with a fixed,
 * server-defined request. The privileged requestor token is added here,
 * server-side, and the returned `token` must never be handed to the client:
 * callers expose only `sessionPtr` + `frontendRequest` and keep `token` for
 * server-side result verification.
 */
export async function startYiviSession(
	purpose: YiviDisclosurePurpose
): Promise<YiviSessionPackage> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (YIVI_SERVER_TOKEN) headers['Authorization'] = YIVI_SERVER_TOKEN;

	const response = await fetch(`${YIVI_SERVER_URL}/session`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ '@context': DISCLOSURE_CONTEXT, disclose: discloseFor(purpose) })
	});

	if (!response.ok) {
		throw new Error(`Yivi session creation failed: ${response.status}`);
	}

	const pkg = (await response.json()) as YiviSessionPackage;
	return { sessionPtr: pkg.sessionPtr, frontendRequest: pkg.frontendRequest, token: pkg.token };
}

/**
 * Parse the value of the requestor-token cookie set by the session-start route.
 * Returns null for any missing/malformed value or unknown purpose.
 */
export function parseRequestorTokenCookie(
	value: string | undefined
): { purpose: YiviDisclosurePurpose; token: string } | null {
	if (!value) return null;
	const idx = value.indexOf(':');
	if (idx <= 0) return null;
	const purpose = value.slice(0, idx);
	const token = value.slice(idx + 1);
	if (!token) return null;
	if (purpose !== 'login-org' && purpose !== 'login-admin' && purpose !== 'register') return null;
	return { purpose, token };
}

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
	const headers: Record<string, string> = {};
	if (YIVI_SERVER_TOKEN) headers['Authorization'] = YIVI_SERVER_TOKEN;

	const response = await fetch(`${YIVI_SERVER_URL}/session/${irmaSessionToken}/result`, {
		method: 'GET',
		headers
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
