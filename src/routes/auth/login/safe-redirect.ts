// The post-login `redirect` query param is attacker-controlled, so it must
// never be handed to `redirect()`/`goto()` without validation — otherwise it
// is an open redirect (an attacker can send `?redirect=https://evil.example`
// or the protocol-relative `?redirect=//evil.example` to bounce a logged-in
// user off-site). Only same-origin, path-absolute targets are allowed.

export const DEFAULT_REDIRECT = '/portal/dashboard';

/**
 * True if `value` contains any C0 control character (U+0000–U+001F, incl.
 * TAB/LF/CR). Browsers strip these from URLs before navigating, so a value
 * like `/\t/evil.example` or `/\n//evil.example` would slip past the slash
 * checks below and then normalise to a protocol-relative, off-origin URL.
 * Strip-then-parse is the classic open-redirect bypass, so we reject any such
 * value up front. (Expressed as a char-code scan to keep literal control
 * characters out of the source.)
 */
function hasControlChar(value: string): boolean {
	for (let i = 0; i < value.length; i++) {
		if (value.charCodeAt(i) <= 0x1f) return true;
	}
	return false;
}

/**
 * Return a safe post-login redirect target. A value is only accepted when it
 * begins with a single `/` (a same-origin absolute path). Everything else —
 * empty/missing values, values containing control characters, absolute URLs
 * (`https://…`), protocol-relative URLs (`//host`) and the backslash variant
 * browsers normalise to them (`/\host`) — falls back to {@link DEFAULT_REDIRECT}.
 */
export function safeRedirect(target: string | null | undefined): string {
	if (!target) return DEFAULT_REDIRECT;
	if (hasControlChar(target)) return DEFAULT_REDIRECT;
	if (!target.startsWith('/')) return DEFAULT_REDIRECT;
	// Reject protocol-relative URLs. Browsers treat `\` as `/`, so `/\host`
	// escapes the origin just like `//host` does.
	if (target[1] === '/' || target[1] === '\\') return DEFAULT_REDIRECT;
	return target;
}
