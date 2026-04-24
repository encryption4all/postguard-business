import { browser } from '$app/environment';
import { register, init } from 'svelte-i18n';

register('en-US', () => import('$lib/locales/en.json'));
register('nl-NL', () => import('$lib/locales/nl.json'));

const defaultLanguage = 'en-US';

function getInitialLocale(): string {
	const stored = localStorage.getItem('preferredLanguage');
	if (stored) return stored;
	const lang = window.navigator.language;
	return lang.startsWith('nl') ? 'nl-NL' : 'en-US';
}

init({
	fallbackLocale: defaultLanguage,
	initialLocale: browser ? getInitialLocale() : defaultLanguage
});
