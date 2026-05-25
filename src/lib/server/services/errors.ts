export function isUniqueViolation(err: unknown): boolean {
	const msg = errorMessage(err);
	const cause = errorMessage((err as { cause?: unknown } | null)?.cause);
	const haystack = `${msg}\n${cause}`.toLowerCase();
	return haystack.includes('duplicate key') || haystack.includes('unique');
}

function errorMessage(value: unknown): string {
	if (value instanceof Error) return value.message;
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object' && 'message' in value) {
		const m = (value as { message?: unknown }).message;
		if (typeof m === 'string') return m;
	}
	return '';
}
