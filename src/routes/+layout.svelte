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

<div id="app">
	{@render children()}
</div>
