import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { organizations } from '$lib/server/db/schema';
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
			await db.insert(organizations).values({
				name: name!,
				domain: domain!,
				email: email!,
				contactName: contactName!,
				phone,
				kvkNumber
			});
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
