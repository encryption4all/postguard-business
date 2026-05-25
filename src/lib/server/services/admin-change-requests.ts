export const APPROVABLE_FIELDS = ['name', 'domain', 'signingEmail', 'kvkNumber'] as const;
export type ApprovableField = (typeof APPROVABLE_FIELDS)[number];

export function isApprovableField(value: string): value is ApprovableField {
	return (APPROVABLE_FIELDS as readonly string[]).includes(value);
}

export class InvalidChangeRequestFieldError extends Error {
	readonly fieldName: string;
	constructor(fieldName: string) {
		super(`Unknown change-request fieldName: ${fieldName}`);
		this.name = 'InvalidChangeRequestFieldError';
		this.fieldName = fieldName;
	}
}
