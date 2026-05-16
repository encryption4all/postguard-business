<script lang="ts">
	import '$lib/global.scss';
	import { locale } from 'svelte-i18n';

	let { children } = $props();

	$effect(() => {
		if ($locale) {
			document.documentElement.lang = $locale.substring(0, 2);
		}
	});
</script>

<a href="#main-content" class="skip-link visually-hidden">Skip to main content</a>

<div id="app">
	{@render children()}
</div>

<style>
	.skip-link:focus {
		position: absolute;
		top: 0;
		left: 0;
		width: auto;
		height: auto;
		overflow: visible;
		padding: 8px 16px;
		background: var(--pg-primary-bg, #7c3aed);
		color: #fff;
		text-decoration: none;
		outline: 2px solid #fff;
		outline-offset: 2px;
		z-index: 1000;
	}
</style>
