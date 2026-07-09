import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// yivi.ts pulls YIVI_SERVER_URL / YIVI_SERVER_TOKEN from the validated config,
// which reads the private env at import time. Provide a fixed env with a
// non-empty requestor token so we can assert it is used server-side.
vi.mock('$env/dynamic/private', () => ({
	env: {
		DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
		YIVI_SERVER_URL: 'http://yivi.test:8088',
		YIVI_SERVER_TOKEN: 'secret-requestor-token'
	}
}));

import { startYiviSession, parseRequestorTokenCookie, ATTR } from '$lib/server/auth/yivi';

const PACKAGE = {
	sessionPtr: { u: '/irma/session/abc123', irmaqr: 'disclosing' },
	frontendRequest: { authorization: 'frontend-token', maxProtocolVersion: '1.1' },
	token: 'requestor-session-token'
};

function mockFetchOk() {
	return vi.fn().mockResolvedValue({
		ok: true,
		status: 200,
		json: async () => PACKAGE
	});
}

describe('startYiviSession', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', mockFetchOk());
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('POSTs to the upstream /session with the privileged requestor token', async () => {
		await startYiviSession('login-org');
		const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('http://yivi.test:8088/session');
		expect(init.method).toBe('POST');
		expect(init.headers.Authorization).toBe('secret-requestor-token');
		expect(init.headers['Content-Type']).toBe('application/json');
	});

	it('sends a fixed disclosure request the client cannot influence', async () => {
		await startYiviSession('login-org');
		const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body['@context']).toBe('https://irma.app/ld/request/disclosure/v2');
		// org login discloses only the email attribute
		expect(body.disclose).toEqual([[[ATTR.email]]]);
	});

	it('discloses email + full name + phone for admin login and registration', async () => {
		const expected = [[[ATTR.email]], [[ATTR.fullName]], [[ATTR.phone]]];

		await startYiviSession('login-admin');
		let fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
		expect(JSON.parse(fetchMock.mock.calls[0][1].body).disclose).toEqual(expected);

		vi.stubGlobal('fetch', mockFetchOk());
		await startYiviSession('register');
		fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
		expect(JSON.parse(fetchMock.mock.calls[0][1].body).disclose).toEqual(expected);
	});

	it('returns the sessionPtr, frontend token, and the requestor token to keep server-side', async () => {
		const pkg = await startYiviSession('login-org');
		expect(pkg.sessionPtr).toEqual(PACKAGE.sessionPtr);
		expect(pkg.frontendRequest).toEqual(PACKAGE.frontendRequest);
		expect(pkg.token).toBe(PACKAGE.token);
	});

	it('throws when the upstream rejects the creation', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
		);
		await expect(startYiviSession('login-org')).rejects.toThrow(/failed/i);
	});
});

describe('parseRequestorTokenCookie', () => {
	it('parses a valid purpose:token value', () => {
		expect(parseRequestorTokenCookie('login-org:tok123')).toEqual({
			purpose: 'login-org',
			token: 'tok123'
		});
		expect(parseRequestorTokenCookie('login-admin:tok123')).toEqual({
			purpose: 'login-admin',
			token: 'tok123'
		});
		expect(parseRequestorTokenCookie('register:tok123')).toEqual({
			purpose: 'register',
			token: 'tok123'
		});
	});

	it('keeps a token that itself contains a colon', () => {
		expect(parseRequestorTokenCookie('register:a:b:c')).toEqual({
			purpose: 'register',
			token: 'a:b:c'
		});
	});

	it('rejects missing, empty, or malformed values', () => {
		expect(parseRequestorTokenCookie(undefined)).toBeNull();
		expect(parseRequestorTokenCookie('')).toBeNull();
		expect(parseRequestorTokenCookie('login-org')).toBeNull();
		expect(parseRequestorTokenCookie('login-org:')).toBeNull();
		expect(parseRequestorTokenCookie(':tok')).toBeNull();
	});

	it('rejects an unknown purpose', () => {
		expect(parseRequestorTokenCookie('admin:tok')).toBeNull();
		expect(parseRequestorTokenCookie('issuance:tok')).toBeNull();
	});
});
