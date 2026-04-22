import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { organizations, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { isEnabled } from '$lib/feature-flags';
import { error } from '@sveltejs/kit';

export function load() {
	if (!isEnabled('registration')) {
		error(404, 'Not found');
	}
}

export const actions: Actions = {
	default: async ({ request }) => {
		if (!isEnabled('registration')) {
			return fail(404, {
				errors: { form: 'Not found' } as Record<string, string>,
				values: { name: '' }
			});
		}

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const domain = data.get('domain')?.toString().trim().toLowerCase();
		const email = data.get('email')?.toString().trim().toLowerCase();
		const contactName = data.get('contactName')?.toString().trim();
		const phone = data.get('phone')?.toString().trim() || null;

		// Validation
		const errors: Record<string, string> = {};
		if (!name) errors.name = 'Organization name is required';
		if (!domain) errors.domain = 'Could not derive domain from email';
		if (!email) errors.form = 'Email attribute missing — please verify with Yivi first';
		if (!contactName) errors.form = 'Name attribute missing — please verify with Yivi first';

		if (domain && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(domain)) {
			errors.domain = 'Invalid domain derived from email';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, {
				errors,
				values: { name }
			});
		}

		try {
			const [org] = await db
				.insert(organizations)
				.values({
					name: name!,
					domain: domain!,
					signingEmail: email!
				})
				.returning({ id: organizations.id });

			const [user] = await db
				.insert(users)
				.values({
					email: email!,
					fullName: contactName!,
					phone,
					orgId: org.id
				})
				.returning({ id: users.id });

			await db
				.update(organizations)
				.set({ contactUserId: user.id })
				.where(eq(organizations.id, org.id));
		} catch (err: unknown) {
			const errStr = String(err instanceof Error ? err.stack ?? err.message : err);
			const cause = (err as any)?.cause;
			const causeStr = cause ? String(cause.message ?? cause) : '';
			if (errStr.includes('unique') || errStr.includes('duplicate key') || causeStr.includes('duplicate key')) {
				return fail(409, {
					errors: { domain: 'This domain is already registered' } as Record<string, string>,
					values: { name }
				});
			}
			return fail(500, {
				errors: { form: 'An unexpected error occurred. Please try again.' } as Record<string, string>,
				values: { name }
			});
		}

		return { success: true };
	}
};
