import { describe, it, expect, vi, beforeEach } from 'vitest';

const { setImpersonationMock, isEnabledMock } = vi.hoisted(() => ({
	setImpersonationMock: vi.fn(),
	isEnabledMock: vi.fn()
}));

vi.mock('$lib/server/auth/session', () => ({
	setImpersonation: setImpersonationMock
}));

vi.mock('$lib/feature-flags', () => ({
	isEnabled: (...args: unknown[]) => isEnabledMock(...args)
}));

vi.mock('$lib/server/services/admin', () => ({
	getOrganizationWithRequests: vi.fn(),
	getOrganizationById: vi.fn(),
	approveChangeRequest: vi.fn(),
	rejectChangeRequest: vi.fn(),
	deleteOrganization: vi.fn(),
	activateOrganization: vi.fn(),
	suspendOrganization: vi.fn(),
	addUserToOrganization: vi.fn(),
	logAdminAction: vi.fn()
}));

import { actions } from '../../src/routes/(admin)/admin/organizations/[id]/+page.server';

type ImpersonateEvent = Parameters<NonNullable<typeof actions>['impersonate']>[0];

function buildEvent(overrides: {
	session?: Record<string, unknown> | null;
	orgId?: string;
}): ImpersonateEvent {
	return {
		params: { id: overrides.orgId ?? 'victim-org-id' },
		locals: { session: overrides.session ?? null }
	} as unknown as ImpersonateEvent;
}

describe('admin impersonate action — auth gating', () => {
	beforeEach(() => {
		setImpersonationMock.mockReset();
		isEnabledMock.mockReset();
		isEnabledMock.mockReturnValue(true);
	});

	it('rejects a portal user session (no adminId) without touching the database', async () => {
		const portalSession = {
			id: 'portal-session-id',
			userId: 'portal-user-id',
			adminId: null,
			userType: 'portal',
			orgId: 'attacker-org-id'
		};

		await expect(
			actions.impersonate(buildEvent({ session: portalSession }))
		).rejects.toMatchObject({ status: 401 });

		expect(setImpersonationMock).not.toHaveBeenCalled();
	});

	it('rejects an unauthenticated session without touching the database', async () => {
		await expect(
			actions.impersonate(buildEvent({ session: null }))
		).rejects.toMatchObject({ status: 401 });

		expect(setImpersonationMock).not.toHaveBeenCalled();
	});

	it('returns a 404 fail when the adminImpersonation flag is off', async () => {
		isEnabledMock.mockReturnValue(false);

		const result = await actions.impersonate(
			buildEvent({
				session: { id: 's', adminId: 'admin-id', userType: 'admin' }
			})
		);

		expect(result).toMatchObject({ status: 404 });
		expect(setImpersonationMock).not.toHaveBeenCalled();
	});

	it('allows an admin session and sets impersonation on the admin session row', async () => {
		setImpersonationMock.mockResolvedValueOnce(undefined);

		const adminSession = {
			id: 'admin-session-id',
			adminId: 'admin-id',
			userType: 'admin'
		};

		await expect(
			actions.impersonate(
				buildEvent({ session: adminSession, orgId: 'target-org-id' })
			)
		).rejects.toMatchObject({ status: 303, location: '/portal/dashboard' });

		expect(setImpersonationMock).toHaveBeenCalledTimes(1);
		expect(setImpersonationMock).toHaveBeenCalledWith(
			'admin-session-id',
			'target-org-id'
		);
	});
});
