// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: {
				id: string;
				userType: 'org' | 'admin';
				orgId: string | null;
				adminId: string | null;
				impersonatingOrgId: string | null;
				yiviAttributes: Record<string, string>;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
