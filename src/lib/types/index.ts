export interface Organization {
	id: string;
	name: string;
	domain: string;
	signingEmail: string;
	kvkNumber: string | null;
	contactUserId: string | null;
	status: 'pending' | 'active' | 'suspended';
	createdAt: Date;
	updatedAt: Date;
}

export interface User {
	id: string;
	email: string;
	fullName: string;
	phone: string | null;
	orgId: string;
	createdAt: Date;
}

export interface ApiKey {
	id: string;
	keyPrefix: string;
	name: string;
	orgId: string;
	signingAttrs: SigningAttrs;
	createdAt: Date;
	lastUsedAt: Date | null;
	expiresAt: Date;
	revokedAt: Date | null;
}

export interface SigningAttrs {
	orgName: boolean;
	phone: boolean;
	kvkNumber: boolean;
	email: boolean;
}

export interface ChangeRequest {
	id: string;
	orgId: string;
	fieldName: string;
	oldValue: string | null;
	newValue: string;
	status: 'pending' | 'approved' | 'rejected';
	requestedAt: Date;
	reviewedAt: Date | null;
	reviewedBy: string | null;
	reviewNotes: string | null;
}

export interface EmailAuditEntry {
	id: string;
	orgId: string;
	apiKeyId: string | null;
	recipient: string;
	subject: string | null;
	signedAt: Date;
	revokedAt: Date | null;
	readAt: Date | null;
	messageId: string | null;
}

export interface DnsVerification {
	id: string;
	orgId: string;
	domain: string;
	txtRecord: string;
	verified: boolean;
	lastCheckedAt: Date | null;
	verifiedAt: Date | null;
}

export interface AdminAccount {
	id: string;
	email: string;
	fullName: string;
	phone: string;
	isActive: boolean;
}

export interface AdminAuditEntry {
	id: string;
	adminId: string;
	action: string;
	targetType: string | null;
	targetId: string | null;
	details: Record<string, unknown>;
	ipAddress: string | null;
	createdAt: Date;
}
