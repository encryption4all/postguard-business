import { describe, it, expect } from 'vitest';
import type {
	Organization,
	ApiKey,
	SigningAttrs,
	ChangeRequest,
	EmailAuditEntry,
	DnsVerification,
	AdminAccount,
	AdminAuditEntry
} from '$lib/types';

describe('type definitions', () => {
	it('Organization type should be structurally correct', () => {
		const org: Organization = {
			id: 'test-uuid',
			name: 'Test Org',
			domain: 'test.com',
			email: 'admin@test.com',
			contactName: 'John Doe',
			phone: '+31612345678',
			kvkNumber: '12345678',
			status: 'active',
			createdAt: new Date(),
			updatedAt: new Date()
		};
		expect(org.status).toBe('active');
	});

	it('ApiKey type should have required signing attributes', () => {
		const attrs: SigningAttrs = {
			orgName: true,
			phone: false,
			kvkNumber: true,
			email: true
		};
		expect(attrs.orgName).toBe(true);
		expect(attrs.phone).toBe(false);
	});

	it('ApiKey type should be structurally correct', () => {
		const key: ApiKey = {
			id: 'test-uuid',
			keyPrefix: 'PG-ab12',
			name: 'Production Key',
			orgId: 'org-uuid',
			signingAttrs: { orgName: true, phone: false, kvkNumber: true, email: true },
			createdAt: new Date(),
			lastUsedAt: null,
			expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
			revokedAt: null
		};
		expect(key.keyPrefix).toBe('PG-ab12');
	});

	it('ChangeRequest type should support all statuses', () => {
		const statuses: ChangeRequest['status'][] = ['pending', 'approved', 'rejected'];
		expect(statuses).toHaveLength(3);
	});

	it('EmailAuditEntry type should be structurally correct', () => {
		const entry: EmailAuditEntry = {
			id: 'test-uuid',
			orgId: 'org-uuid',
			apiKeyId: 'key-uuid',
			recipient: 'user@example.com',
			subject: 'Test email',
			signedAt: new Date(),
			revokedAt: null,
			readAt: null,
			messageId: '<msg-id@example.com>'
		};
		expect(entry.recipient).toBe('user@example.com');
	});

	it('DnsVerification type should be structurally correct', () => {
		const dns: DnsVerification = {
			id: 'test-uuid',
			orgId: 'org-uuid',
			domain: 'test.com',
			txtRecord: 'postguard-verify=abc123',
			verified: false,
			lastCheckedAt: null,
			verifiedAt: null
		};
		expect(dns.verified).toBe(false);
	});

	it('AdminAccount type should be structurally correct', () => {
		const admin: AdminAccount = {
			id: 'test-uuid',
			email: 'admin@postguard.eu',
			fullName: 'Admin User',
			phone: '+31698765432',
			isActive: true
		};
		expect(admin.isActive).toBe(true);
	});

	it('AdminAuditEntry type should be structurally correct', () => {
		const entry: AdminAuditEntry = {
			id: 'test-uuid',
			adminId: 'admin-uuid',
			action: 'approve_change',
			targetType: 'organization',
			targetId: 'org-uuid',
			details: { reason: 'Verified via phone call' },
			ipAddress: '192.168.1.1',
			createdAt: new Date()
		};
		expect(entry.action).toBe('approve_change');
	});
});
