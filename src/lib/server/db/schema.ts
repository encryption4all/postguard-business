import { pgTable, uuid, varchar, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 256 }).notNull(),
	domain: varchar('domain', { length: 256 }).notNull().unique(),
	email: varchar('email', { length: 256 }).notNull(),
	contactName: varchar('contact_name', { length: 256 }).notNull(),
	phone: varchar('phone', { length: 32 }),
	kvkNumber: varchar('kvk_number', { length: 32 }),
	status: varchar('status', { length: 32 }).notNull().default('pending'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const adminAccounts = pgTable('admin_accounts', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: varchar('email', { length: 256 }).notNull().unique(),
	fullName: varchar('full_name', { length: 256 }).notNull(),
	phone: varchar('phone', { length: 32 }).notNull(),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const apiKeys = pgTable(
	'business_api_keys',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		keyHash: varchar('key_hash', { length: 128 }).notNull().unique(),
		keyPrefix: varchar('key_prefix', { length: 16 }).notNull(),
		name: varchar('name', { length: 256 }).notNull(),
		orgId: uuid('org_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		signingAttrs: jsonb('signing_attrs').notNull().default({}),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		revokedAt: timestamp('revoked_at', { withTimezone: true }),
		createdBy: uuid('created_by').references(() => adminAccounts.id)
	},
	(table) => [index('idx_api_keys_org').on(table.orgId)]
);

export const sessions = pgTable(
	'sessions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
		userType: varchar('user_type', { length: 16 }).notNull(),
		orgId: uuid('org_id').references(() => organizations.id),
		adminId: uuid('admin_id').references(() => adminAccounts.id),
		impersonatingOrgId: uuid('impersonating_org_id').references(() => organizations.id),
		yiviAttributes: jsonb('yivi_attributes').notNull().default({}),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index('idx_sessions_expires').on(table.expiresAt)]
);

export const changeRequests = pgTable(
	'change_requests',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		orgId: uuid('org_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		fieldName: varchar('field_name', { length: 64 }).notNull(),
		oldValue: varchar('old_value', { length: 1024 }),
		newValue: varchar('new_value', { length: 1024 }).notNull(),
		status: varchar('status', { length: 32 }).notNull().default('pending'),
		requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
		reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
		reviewedBy: uuid('reviewed_by').references(() => adminAccounts.id),
		reviewNotes: varchar('review_notes', { length: 2048 })
	},
	(table) => [
		index('idx_change_requests_org').on(table.orgId),
		index('idx_change_requests_status').on(table.status)
	]
);

export const emailAuditLog = pgTable(
	'email_audit_log',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		orgId: uuid('org_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		apiKeyId: uuid('api_key_id').references(() => apiKeys.id, { onDelete: 'set null' }),
		recipient: varchar('recipient', { length: 512 }).notNull(),
		subject: varchar('subject', { length: 512 }),
		signedAt: timestamp('signed_at', { withTimezone: true }).notNull().defaultNow(),
		revokedAt: timestamp('revoked_at', { withTimezone: true }),
		revokedBy: uuid('revoked_by'),
		readAt: timestamp('read_at', { withTimezone: true }),
		messageId: varchar('message_id', { length: 512 }),
		metadata: jsonb('metadata').default({})
	},
	(table) => [
		index('idx_email_log_org').on(table.orgId),
		index('idx_email_log_signed').on(table.signedAt)
	]
);

export const dnsVerifications = pgTable('dns_verifications', {
	id: uuid('id').primaryKey().defaultRandom(),
	orgId: uuid('org_id')
		.notNull()
		.references(() => organizations.id, { onDelete: 'cascade' })
		.unique(),
	domain: varchar('domain', { length: 256 }).notNull(),
	txtRecord: varchar('txt_record', { length: 512 }).notNull(),
	verified: boolean('verified').notNull().default(false),
	lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
	verifiedAt: timestamp('verified_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const adminAuditLog = pgTable(
	'admin_audit_log',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		adminId: uuid('admin_id')
			.notNull()
			.references(() => adminAccounts.id),
		action: varchar('action', { length: 64 }).notNull(),
		targetType: varchar('target_type', { length: 64 }),
		targetId: uuid('target_id'),
		details: jsonb('details').default({}),
		ipAddress: varchar('ip_address', { length: 45 }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('idx_admin_audit_admin').on(table.adminId),
		index('idx_admin_audit_created').on(table.createdAt)
	]
);
