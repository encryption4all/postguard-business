import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import {
	listOrganizations,
	listPendingRequests,
	activateOrganization,
	suspendOrganization,
	deleteOrganization,
	getOrganizationById,
	createOrganization,
	logAdminAction
} from '$lib/server/services/admin';
import { isEnabled } from '$lib/feature-flags';

export const load: PageServerLoad = async () => {
	if (!isEnabled('adminPanel')) error(404, 'Not found');
	const [orgs, pendingRequests] = await Promise.all([
		listOrganizations(),
		listPendingRequests()
	]);

	return {
		organizations: orgs,
		pendingRequests,
		orgStatusEnabled: isEnabled('adminOrgStatus')
	};
};

export const actions: Actions = {
	activate: async ({ request, locals }) => {
		if (!isEnabled('adminOrgStatus')) return fail(404);
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');
		const data = await request.formData();
		const orgId = data.get('orgId')?.toString();
		if (!orgId) return;

		await activateOrganization(orgId);
		await logAdminAction(adminId, 'activate_org', 'organization', orgId, {}, null);
	},
	suspend: async ({ request, locals }) => {
		if (!isEnabled('adminOrgStatus')) return fail(404);
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');
		const data = await request.formData();
		const orgId = data.get('orgId')?.toString();
		if (!orgId) return;

		await suspendOrganization(orgId);
		await logAdminAction(adminId, 'suspend_org', 'organization', orgId, {}, null);
	},
	delete: async ({ request, locals }) => {
		if (!isEnabled('adminOrgStatus')) return fail(404);
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');
		const data = await request.formData();
		const orgId = data.get('orgId')?.toString();
		const confirmName = data.get('confirmName')?.toString() ?? '';
		if (!orgId) return fail(400, { error: 'Missing organization ID' });

		const org = await getOrganizationById(orgId);
		if (!org) return fail(404, { error: 'Organization not found' });

		if (confirmName.trim() !== org.name.trim()) {
			return fail(400, { error: 'name_mismatch' });
		}

		await deleteOrganization(orgId);
		await logAdminAction(
			adminId,
			'delete_org',
			'organization',
			orgId,
			{ name: org.name, domain: org.domain },
			null
		);
		return { deleted: true, orgName: org.name };
	},
	create: async ({ request, locals }) => {
		if (!isEnabled('adminOrgStatus')) return fail(404);
		const adminId = locals.session?.adminId;
		if (!adminId) error(401, 'Not authenticated');

		const values = parseCreateInput(await request.formData());
		const errors = validateCreateInput(values);

		if (Object.keys(errors).length > 0) {
			return fail(400, { createErrors: errors, createValues: values });
		}

		try {
			const org = await createOrganization(values);
			await logAdminAction(adminId, 'create_org', 'organization', org.id, { ...values }, null);
			return { created: true, createdName: values.name };
		} catch (err: unknown) {
			if (isDuplicateKeyError(err)) {
				return fail(409, {
					createErrors: { domain: 'create_duplicate_domain' } as Record<string, string>,
					createValues: values
				});
			}
			return fail(500, {
				createErrors: { form: 'create_unexpected' } as Record<string, string>,
				createValues: values
			});
		}
	}
};

type CreateInput = {
	name: string;
	domain: string;
	signingEmail: string;
	kvkNumber: string | null;
	status: 'active' | 'pending' | 'suspended';
};

function asString(value: FormDataEntryValue | null): string {
	return typeof value === 'string' ? value : '';
}

function parseCreateInput(data: FormData): CreateInput {
	const statusInput = asString(data.get('status'));
	return {
		name: asString(data.get('name')).trim(),
		domain: asString(data.get('domain')).trim().toLowerCase(),
		signingEmail: asString(data.get('signingEmail')).trim().toLowerCase(),
		kvkNumber: asString(data.get('kvkNumber')).trim() || null,
		status: statusInput === 'pending' || statusInput === 'suspended' ? statusInput : 'active'
	};
}

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCreateInput(input: CreateInput): Record<string, string> {
	const errors: Record<string, string> = {};
	if (!input.name) errors.name = 'create_required_name';
	if (!input.domain) errors.domain = 'create_required_domain';
	else if (!DOMAIN_RE.test(input.domain)) errors.domain = 'create_invalid_domain';
	if (!input.signingEmail) errors.signingEmail = 'create_required_email';
	else if (!EMAIL_RE.test(input.signingEmail)) errors.signingEmail = 'create_invalid_email';
	return errors;
}

function errMessage(value: unknown): string {
	if (value instanceof Error) return value.message;
	if (typeof value === 'string') return value;
	return '';
}

function isDuplicateKeyError(err: unknown): boolean {
	const top = errMessage(err);
	const cause = errMessage((err as { cause?: unknown })?.cause);
	const haystack = `${top}\n${cause}`;
	return haystack.includes('duplicate key') || haystack.includes('unique');
}
