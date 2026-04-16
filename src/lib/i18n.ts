import { browser } from '$app/environment';
import { init, register } from 'svelte-i18n';

register('en-US', () => import('$lib/locales/en.json'));
register('nl-NL', () => import('$lib/locales/nl.json'));

init({
	fallbackLocale: 'en-US',
	initialLocale: browser
		? localStorage.getItem('preferredLanguage') ?? navigator.language
		: 'en-US'
});
