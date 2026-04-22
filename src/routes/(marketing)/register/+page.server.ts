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
				values: { name: '', domain: '', email: '', contactName: '', phone: null, kvkNumber: null }
			});
		}

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const domain = data.get('domain')?.toString().trim().toLowerCase();
		const email = data.get('email')?.toString().trim().toLowerCase();
		const contactName = data.get('contactName')?.toString().trim();
		const phone = data.get('phone')?.toString().trim() || null;
		const kvkNumber = data.get('kvkNumber')?.toString().trim() || null;

		// Validation
		const errors: Record<string, string> = {};
		if (!name) errors.name = 'Organization name is required';
		if (!domain) errors.domain = 'Domain is required';
		if (!email) errors.email = 'Email is required';
		if (!contactName) errors.contactName = 'Contact name is required';

		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			errors.email = 'Invalid email address';
		}

		if (domain && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(domain)) {
			errors.domain = 'Invalid domain name';
		}

		if (kvkNumber && !/^\d{8}$/.test(kvkNumber)) {
			errors.kvkNumber = 'KvK number must be 8 digits';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, {
				errors,
				values: { name, domain, email, contactName, phone, kvkNumber }
			});
		}

		try {
			// Create org, then user, then link contact person
			const [org] = await db
				.insert(organizations)
				.values({
					name: name!,
					domain: domain!,
					signingEmail: email!,
					kvkNumber
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
			if (err instanceof Error && err.message.includes('unique')) {
				return fail(409, {
					errors: { domain: 'This domain is already registered' } as Record<string, string>,
					values: { name, domain, email, contactName, phone, kvkNumber }
				});
			}
			return fail(500, {
				errors: { form: 'An unexpected error occurred. Please try again.' } as Record<string, string>,
				values: { name, domain, email, contactName, phone, kvkNumber }
			});
		}

		return { success: true };
	}
};
