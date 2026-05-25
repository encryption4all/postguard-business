import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	isApprovableField,
	APPROVABLE_FIELDS,
	InvalidChangeRequestFieldError
} from '../../src/lib/server/services/admin-change-requests';

const { approveChangeRequestMock, logAdminActionMock, isEnabledMock } = vi.hoisted(() => ({
	approveChangeRequestMock: vi.fn(),
	logAdminActionMock: vi.fn(),
	isEnabledMock: vi.fn()
}));

vi.mock('$lib/server/services/admin', () => ({
	getOrganizationWithRequests: vi.fn(),
	getOrganizationById: vi.fn(),
	approveChangeRequest: approveChangeRequestMock,
	rejectChangeRequest: vi.fn(),
	deleteOrganization: vi.fn(),
	activateOrganization: vi.fn(),
	suspendOrganization: vi.fn(),
	addUserToOrganization: vi.fn(),
	logAdminAction: logAdminActionMock
}));

vi.mock('$lib/server/auth/session', () => ({
	setImpersonation: vi.fn()
}));

vi.mock('$lib/feature-flags', () => ({
	isEnabled: (...args: unknown[]) => isEnabledMock(...args)
}));

import { actions } from '../../src/routes/(admin)/admin/organizations/[id]/+page.server';

type ApproveEvent = Parameters<NonNullable<typeof actions>['approve']>[0];

function buildEvent(overrides: {
	session?: Record<string, unknown> | null;
	requestId?: string | null;
	reviewNotes?: string;
}): ApproveEvent {
	const form = new FormData();
	if (overrides.requestId !== null) form.set('requestId', overrides.requestId ?? 'req-id');
	if (overrides.reviewNotes !== undefined) form.set('reviewNotes', overrides.reviewNotes);

	return {
		params: { id: 'org-id' },
		locals: { session: overrides.session ?? null },
		request: { formData: async () => form },
		getClientAddress: () => '127.0.0.1'
	} as unknown as ApproveEvent;
}

describe('isApprovableField', () => {
	it.each([...APPROVABLE_FIELDS])('accepts the allowlist value %s', (field) => {
		expect(isApprovableField(field)).toBe(true);
	});

	it.each(['status', 'contact_user_id', 'signing_email', 'kvk_number', '', 'NAME', 'id'])(
		'rejects unknown field %s',
		(field) => {
			expect(isApprovableField(field)).toBe(false);
		}
	);
});

describe('InvalidChangeRequestFieldError', () => {
	it('carries the offending fieldName', () => {
		const err = new InvalidChangeRequestFieldError('mystery_column');
		expect(err).toBeInstanceOf(Error);
		expect(err.fieldName).toBe('mystery_column');
		expect(err.message).toContain('mystery_column');
	});
});

describe('admin approve action — invalid fieldName handling', () => {
	beforeEach(() => {
		approveChangeRequestMock.mockReset();
		logAdminActionMock.mockReset();
		isEnabledMock.mockReset();
		isEnabledMock.mockReturnValue(true);
	});

	it('rejects when no admin session is present and never calls the service', async () => {
		await expect(
			actions.approve(buildEvent({ session: null, requestId: 'req-1' }))
		).rejects.toMatchObject({ status: 401 });

		expect(approveChangeRequestMock).not.toHaveBeenCalled();
		expect(logAdminActionMock).not.toHaveBeenCalled();
	});

	it('returns 400 when the service throws InvalidChangeRequestFieldError and does not log an admin action', async () => {
		approveChangeRequestMock.mockRejectedValueOnce(
			new InvalidChangeRequestFieldError('mystery_column')
		);

		const result = await actions.approve(
			buildEvent({
				session: { adminId: 'admin-1', userType: 'admin' },
				requestId: 'req-1',
				reviewNotes: 'looks good'
			})
		);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'invalid_field', fieldName: 'mystery_column' }
		});
		expect(logAdminActionMock).not.toHaveBeenCalled();
	});

	it('returns { approved: true } and logs when the service applies the change', async () => {
		approveChangeRequestMock.mockResolvedValueOnce({
			id: 'req-1',
			orgId: 'org-1',
			fieldName: 'name',
			newValue: 'New Name'
		});

		const result = await actions.approve(
			buildEvent({
				session: { adminId: 'admin-1', userType: 'admin' },
				requestId: 'req-1',
				reviewNotes: 'ok'
			})
		);

		expect(result).toEqual({ approved: true });
		expect(approveChangeRequestMock).toHaveBeenCalledWith('req-1', 'admin-1', 'ok');
		expect(logAdminActionMock).toHaveBeenCalledTimes(1);
		expect(logAdminActionMock).toHaveBeenCalledWith(
			'admin-1',
			'approve_change',
			'change_request',
			'req-1',
			{ fieldName: 'name', newValue: 'New Name', reviewNotes: 'ok' },
			'127.0.0.1'
		);
	});

	it('returns { approved: true } without logging when the service reports no matching request', async () => {
		approveChangeRequestMock.mockResolvedValueOnce(null);

		const result = await actions.approve(
			buildEvent({
				session: { adminId: 'admin-1', userType: 'admin' },
				requestId: 'missing-req',
				reviewNotes: ''
			})
		);

		expect(result).toEqual({ approved: true });
		expect(logAdminActionMock).not.toHaveBeenCalled();
	});

	it('re-throws unexpected errors so they surface as 500', async () => {
		const boom = new Error('db exploded');
		approveChangeRequestMock.mockRejectedValueOnce(boom);

		await expect(
			actions.approve(
				buildEvent({
					session: { adminId: 'admin-1', userType: 'admin' },
					requestId: 'req-1'
				})
			)
		).rejects.toBe(boom);

		expect(logAdminActionMock).not.toHaveBeenCalled();
	});
});
