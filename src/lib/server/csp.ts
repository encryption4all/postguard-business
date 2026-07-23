/**
 * Append a source to the connect-src directive of a serialized CSP header.
 *
 * SvelteKit renders the Content-Security-Policy header at build time from
 * svelte.config.js, but some allowed origins are only known at runtime (the
 * Yivi server differs per environment), so they are spliced in per-response.
 */
export function appendConnectSrc(header: string, source: string): string {
	let found = false;
	const directives = header.split(';').map((directive) => {
		const trimmed = directive.trim();
		const [name, ...values] = trimmed.split(/\s+/);
		if (name !== 'connect-src') return trimmed;
		found = true;
		return values.includes(source) ? trimmed : `${trimmed} ${source}`;
	});
	// Without an explicit connect-src, connections fall back to default-src
	// ('self' in our policy); add a directive that keeps that and the source.
	if (!found) directives.push(`connect-src 'self' ${source}`);
	return directives.join('; ');
}
