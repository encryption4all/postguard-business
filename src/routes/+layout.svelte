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

<a href="#main-content" class="skip-link">Skip to main content</a>

<div id="app">
	{@render children()}
</div>

<style>
	.skip-link {
		position: absolute;
		top: -40px;
		left: 0;
		padding: 8px 16px;
		background: var(--pg-primary-bg, #7c3aed);
		color: #fff;
		text-decoration: none;
		z-index: 1000;
	}
	.skip-link:focus {
		top: 0;
		outline: 2px solid #fff;
		outline-offset: 2px;
	}
</style>
