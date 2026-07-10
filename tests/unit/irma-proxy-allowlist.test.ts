import { describe, it, expect } from 'vitest';
import { isAllowed } from '../../src/routes/irma/[...path]/allowlist';

// After hardening, the proxy only forwards the Yivi *frontend* polling
// endpoints — never session creation or the requestor-only result endpoints.
describe('irma proxy path allowlist', () => {
	describe('frontend polling endpoints (allowed)', () => {
		it('allows legacy status polling (GET)', () => {
			expect(isAllowed('session/abc123/status', 'GET')).toBe(true);
			expect(isAllowed('session/abc123/statusevents', 'GET')).toBe(true);
		});

		it('allows chained-sessions frontend status polling (GET)', () => {
			expect(isAllowed('session/abc123/frontend/status', 'GET')).toBe(true);
			expect(isAllowed('session/abc123/frontend/statusevents', 'GET')).toBe(true);
		});

		it('allows frontend options / pairing negotiation (POST)', () => {
			expect(isAllowed('session/abc123/frontend/options', 'POST')).toBe(true);
			expect(isAllowed('session/abc123/frontend/pairingcompleted', 'POST')).toBe(true);
		});

		it('allows cancelling a session (DELETE)', () => {
			expect(isAllowed('session/abc123', 'DELETE')).toBe(true);
		});
	});

	describe('privileged / creation endpoints (rejected)', () => {
		it('rejects session creation', () => {
			expect(isAllowed('session', 'POST')).toBe(false);
			expect(isAllowed('session', 'GET')).toBe(false);
		});

		it('rejects the requestor-only result endpoints', () => {
			expect(isAllowed('session/abc123/result', 'GET')).toBe(false);
			expect(isAllowed('session/abc123/result-jwt', 'GET')).toBe(false);
			expect(isAllowed('session/abc123/getproof', 'GET')).toBe(false);
		});

		it('rejects reading the bare token path (only DELETE allowed)', () => {
			expect(isAllowed('session/abc123', 'GET')).toBe(false);
			expect(isAllowed('session/abc123', 'POST')).toBe(false);
		});
	});

	describe('method restrictions', () => {
		it('rejects status polling with a mutating method', () => {
			expect(isAllowed('session/abc123/status', 'POST')).toBe(false);
			expect(isAllowed('session/abc123/status', 'DELETE')).toBe(false);
		});

		it('rejects unknown frontend endpoints', () => {
			expect(isAllowed('session/abc123/frontend/result', 'GET')).toBe(false);
			expect(isAllowed('session/abc123/frontend/bogus', 'POST')).toBe(false);
		});

		it('is case-insensitive about the HTTP method', () => {
			expect(isAllowed('session/abc123/status', 'get')).toBe(true);
			expect(isAllowed('session/abc123', 'delete')).toBe(true);
		});
	});

	describe('structural rejections', () => {
		it('rejects unknown top-level prefixes', () => {
			expect(isAllowed('scheme', 'GET')).toBe(false);
			expect(isAllowed('configuration', 'GET')).toBe(false);
			expect(isAllowed('keyshare/abc/status', 'GET')).toBe(false);
		});

		it('does not allow prefix-spoofing like sessionadmin', () => {
			expect(isAllowed('sessionadmin', 'GET')).toBe(false);
			expect(isAllowed('sessionfoo/bar/status', 'GET')).toBe(false);
		});

		it('rejects path traversal attempts', () => {
			expect(isAllowed('session/../admin', 'GET')).toBe(false);
			expect(isAllowed('../admin', 'GET')).toBe(false);
			expect(isAllowed('session/..', 'GET')).toBe(false);
			expect(isAllowed('session/..%2fadmin/status', 'GET')).toBe(false);
		});

		it('rejects tokens with unexpected characters', () => {
			expect(isAllowed('session/abc.123/status', 'GET')).toBe(false);
			expect(isAllowed('session/abc-123/status', 'GET')).toBe(false);
			expect(isAllowed('session//status', 'GET')).toBe(false);
		});

		it('rejects empty and undefined paths', () => {
			expect(isAllowed('', 'GET')).toBe(false);
			expect(isAllowed(undefined, 'GET')).toBe(false);
		});

		it('rejects over-long / unexpected path shapes', () => {
			expect(isAllowed('session/abc123/frontend/status/extra', 'GET')).toBe(false);
			expect(isAllowed('session/abc123/frontend', 'GET')).toBe(false);
		});
	});
});
