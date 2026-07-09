// This proxy sits in front of the Yivi/IRMA server. Sessions are created
// *server-side* with a fixed request (see `startYiviSession`) and their results
// are fetched *server-side*; the only thing the browser legitimately needs to
// reach is the IRMA server's *frontend* endpoints for a session it is already
// driving: polling status, listening for status events, negotiating frontend
// options / pairing, and cancelling.
//
// Those frontend endpoints are authenticated by the per-session *frontend*
// token, which the client already holds (`frontendRequest.authorization`) and
// sends itself. They do NOT require — and this proxy no longer attaches — the
// server's privileged requestor token.
//
// Session *creation* (`POST /session`) and the requestor-only result endpoints
// (`/session/{token}/result[...]`) are therefore NOT proxied. Allowing them
// with the requestor credential would re-open the trust boundary this proxy is
// meant to keep server-side.
//
// The Yivi client SDK builds these URLs from `sessionPtr.u`:
//   - legacy:            `${sessionPtr.u}/{status|statusevents}`
//   - chained-sessions:  `${sessionPtr.u}/frontend/{status|statusevents|options|pairingcompleted}`
//   - cancel:            `DELETE ${sessionPtr.u}`
// where `sessionPtr.u` resolves to `/irma/session/{token}` through this proxy.

// GET polling / status-event endpoints (both legacy and `/frontend/` forms).
const GET_ENDPOINTS = new Set(['status', 'statusevents']);
// POST frontend endpoints (pairing / frontend-options negotiation).
const POST_FRONTEND_ENDPOINTS = new Set(['options', 'pairingcompleted']);

// IRMA session tokens are base62 (irmago `common.NewSessionToken`).
const TOKEN_RE = /^[A-Za-z0-9]+$/;

/**
 * Decide whether a proxied `/irma/<path>` request is one of the frontend
 * polling endpoints the browser is allowed to reach for its own session.
 */
export function isAllowed(path: string | undefined, method: string): boolean {
	if (!path) return false;
	// Defence in depth against path traversal (the token regex already blocks it).
	if (path.includes('..')) return false;

	const segments = path.split('/');
	if (segments[0] !== 'session') return false;

	const token = segments[1];
	if (!token || !TOKEN_RE.test(token)) return false;

	const m = method.toUpperCase();

	// `DELETE session/{token}` — cancel the session.
	if (segments.length === 2) {
		return m === 'DELETE';
	}

	// Legacy: `GET session/{token}/{status|statusevents}`.
	if (segments.length === 3) {
		return m === 'GET' && GET_ENDPOINTS.has(segments[2]);
	}

	// Chained-sessions: `session/{token}/frontend/{endpoint}`.
	if (segments.length === 4 && segments[2] === 'frontend') {
		const endpoint = segments[3];
		if (m === 'GET') return GET_ENDPOINTS.has(endpoint);
		if (m === 'POST') return POST_FRONTEND_ENDPOINTS.has(endpoint);
		return false;
	}

	return false;
}
