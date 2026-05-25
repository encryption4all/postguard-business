import { describe, it, expect, vi, beforeEach } from 'vitest';

const { resolveMock, selectLimitMock, updateWhereMock, dbMock } = vi.hoisted(() => {
	const selectLimitMock = vi.fn();
	const updateWhereMock = vi.fn().mockResolvedValue(undefined);
	const dbMock = {
		select: vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: selectLimitMock
				})
			})
		}),
		update: vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: updateWhereMock
			})
		}),
		insert: vi.fn()
	};
	return {
		resolveMock: vi.fn(),
		selectLimitMock,
		updateWhereMock,
		dbMock
	};
});

vi.mock('dns/promises', () => ({
	resolve: (...args: unknown[]) => resolveMock(...args)
}));

vi.mock('$lib/server/db', () => ({ db: dbMock }));

vi.mock('$lib/server/db/schema', () => ({
	dnsVerifications: { id: 'id', orgId: 'orgId' }
}));

vi.mock('drizzle-orm', () => ({
	eq: (a: unknown, b: unknown) => ({ a, b })
}));

import { verifyDns } from '$lib/server/services/dns-verification';

const record = {
	id: 'rec-1',
	orgId: 'org-1',
	domain: 'example.com',
	txtRecord: 'postguard-verify=deadbeef'
};

beforeEach(() => {
	resolveMock.mockReset();
	selectLimitMock.mockReset();
	updateWhereMock.mockClear();
	selectLimitMock.mockResolvedValue([record]);
});

describe('verifyDns', () => {
	it('returns verified: true when the TXT record matches', async () => {
		resolveMock.mockResolvedValueOnce([[record.txtRecord]]);
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await verifyDns('org-1');

		expect(result).toEqual({ verified: true });
		expect(errSpy).not.toHaveBeenCalled();
		errSpy.mockRestore();
	});

	it('returns the "not found in DNS" message when no TXT matches', async () => {
		resolveMock.mockResolvedValueOnce([['some-other-txt']]);

		const result = await verifyDns('org-1');

		expect(result.verified).toBe(false);
		expect(result.error).toContain(record.txtRecord);
		expect(result.error).toContain(record.domain);
		expect(updateWhereMock).toHaveBeenCalledTimes(1);
	});

	it('returns a "domain not found" message and logs when resolve throws ENOTFOUND', async () => {
		const enotfound = Object.assign(new Error('getaddrinfo ENOTFOUND example.com'), {
			code: 'ENOTFOUND'
		});
		resolveMock.mockRejectedValueOnce(enotfound);
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await verifyDns('org-1');

		expect(result.verified).toBe(false);
		expect(result.error).toBe(`Domain ${record.domain} not found`);
		expect(errSpy).toHaveBeenCalledTimes(1);
		expect(errSpy.mock.calls[0][1]).toMatchObject({
			orgId: 'org-1',
			domain: record.domain,
			code: 'ENOTFOUND'
		});
		expect(updateWhereMock).toHaveBeenCalledTimes(1);
		errSpy.mockRestore();
	});

	it('returns a "no TXT records" message and logs when resolve throws ENODATA', async () => {
		const enodata = Object.assign(new Error('queryTxt ENODATA example.com'), { code: 'ENODATA' });
		resolveMock.mockRejectedValueOnce(enodata);
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await verifyDns('org-1');

		expect(result.verified).toBe(false);
		expect(result.error).toBe(`No TXT records found for ${record.domain}`);
		expect(errSpy).toHaveBeenCalledTimes(1);
		expect(errSpy.mock.calls[0][1]).toMatchObject({ code: 'ENODATA' });
		errSpy.mockRestore();
	});

	it('falls back to the generic message and logs when resolve throws a plain Error', async () => {
		resolveMock.mockRejectedValueOnce(new Error('something else'));
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await verifyDns('org-1');

		expect(result.verified).toBe(false);
		expect(result.error).toBe(`Could not resolve DNS for ${record.domain}`);
		expect(errSpy).toHaveBeenCalledTimes(1);
		expect(errSpy.mock.calls[0][1]).toMatchObject({
			orgId: 'org-1',
			domain: record.domain,
			message: 'something else'
		});
		expect(updateWhereMock).toHaveBeenCalledTimes(1);
		errSpy.mockRestore();
	});

	it('returns the "no verification record" message when none exists for the org', async () => {
		selectLimitMock.mockResolvedValueOnce([]);

		const result = await verifyDns('org-with-no-record');

		expect(result).toEqual({ verified: false, error: 'No DNS verification record found' });
		expect(resolveMock).not.toHaveBeenCalled();
		expect(updateWhereMock).not.toHaveBeenCalled();
	});
});
