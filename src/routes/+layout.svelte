<script lang="ts">
	import '$lib/global.scss';

	let { children } = $props();
</script>

<div id="app">
	{@render children()}
</div>
