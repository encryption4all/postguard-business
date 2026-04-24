<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<Header
	showPricing={data.marketingFlags.pricing}
	showRegister={data.marketingFlags.registration}
	auth={data.auth}
/>
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
