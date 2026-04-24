// The Yivi frontend SDK only talks to /irma/session[...]. Everything else is
// either administrative (e.g. /scheme, /configuration) or unknown territory
// on the upstream Yivi server and must not be proxied with the server's
// auth token.
export const ALLOWED_PREFIXES = ['session'];

export function isAllowed(path: string | undefined): boolean {
	if (!path) return false;
	// Reject path traversal attempts outright.
	if (path.includes('..')) return false;
	const firstSegment = path.split('/')[0];
	return ALLOWED_PREFIXES.includes(firstSegment);
}
