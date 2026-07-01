// The post-login `redirect` query param is attacker-controlled, so it must
// never be handed to `redirect()`/`goto()` without validation — otherwise it
// is an open redirect (an attacker can send `?redirect=https://evil.example`
// or the protocol-relative `?redirect=//evil.example` to bounce a logged-in
// user off-site). Only same-origin, path-absolute targets are allowed.

export const DEFAULT_REDIRECT = '/portal/dashboard';

/**
 * Return a safe post-login redirect target. A value is only accepted when it
 * begins with a single `/` (a same-origin absolute path). Everything else —
 * empty/missing values, absolute URLs (`https://…`), protocol-relative URLs
 * (`//host`) and the backslash variant browsers normalise to them (`/\host`)
 * — falls back to {@link DEFAULT_REDIRECT}.
 */
export function safeRedirect(target: string | null | undefined): string {
	if (!target || !target.startsWith('/')) return DEFAULT_REDIRECT;
	// Reject protocol-relative URLs. Browsers treat `\` as `/`, so `/\host`
	// escapes the origin just like `//host` does.
	if (target[1] === '/' || target[1] === '\\') return DEFAULT_REDIRECT;
	return target;
}
