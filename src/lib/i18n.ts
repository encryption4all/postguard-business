import { browser } from '$app/environment';
import { register, init } from 'svelte-i18n';

register('en-US', () => import('$lib/locales/en.json'));
register('nl-NL', () => import('$lib/locales/nl.json'));

export const defaultLanguage = 'en-US';
export const supportedLocales = ['en-US', 'nl-NL'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

/**
 * Map an Accept-Language header (or any tag) to a registered locale.
 * Falls back to the default language for unsupported / missing values.
 */
export function normalizeLocale(input: string | null | undefined): SupportedLocale {
	if (!input) return defaultLanguage;
	const tag = input.split(',')[0]?.trim().toLowerCase() ?? '';
	if (!tag) return defaultLanguage;
	if (tag === 'nl' || tag.startsWith('nl-')) return 'nl-NL';
	if (tag === 'en' || tag.startsWith('en-')) return 'en-US';
	return defaultLanguage;
}

function getClientInitialLocale(): string {
	const stored = localStorage.getItem('preferredLanguage');
	if (stored) return stored;
	return normalizeLocale(window.navigator.language);
}

// Per-request initialisation. Called from `+layout.ts` so the universal
// load runs it on every request. The server hook no longer touches the
// svelte-i18n locale store (see hooks.server.ts), which avoids a stale
// global locale leaking from one request into another between hook calls.
export function initI18n(serverLocale?: string | null): void {
	const initialLocale = browser
		? getClientInitialLocale()
		: normalizeLocale(serverLocale);
	init({
		fallbackLocale: defaultLanguage,
		initialLocale
	});
}
