<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<Header />
<main>
	{@render children()}
</main>
<Footer />

<style lang="scss">
	main {
		flex: 1;
		width: 100%;
	}
</style>
