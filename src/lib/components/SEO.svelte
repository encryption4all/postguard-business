<script lang="ts">
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';

	let {
		title = '',
		description = '',
		ogImage = '',
		ogType = 'website',
		canonical = '',
		jsonLd = null as Record<string, unknown> | Record<string, unknown>[] | null
	} = $props();

	const siteName = 'PostGuard for Business';
	const defaultDescription = 'Identity-based email signing and encryption for organizations.';

	const siteUrl = $derived(env.PUBLIC_SITE_URL || `${page.url.protocol}//${page.url.host}`);
	const defaultImage = $derived(`${siteUrl}/pg_logo.png`);
	const canonicalUrl = $derived(canonical || `${siteUrl}${page.url.pathname}`);
	const isStaging = $derived(page.url.hostname.includes('staging'));
	const jsonLdString = $derived(
		jsonLd ? JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : null
	);
	// Split the literal tags so the Svelte compiler doesn't try to parse a nested <script> element.
	const jsonLdScript = $derived(
		jsonLdString ? `<${'script'} type="application/ld+json">${jsonLdString}</${'script'}>` : ''
	);
</script>

<svelte:head>
	<title>{title ? `${title} | ${siteName}` : siteName}</title>
	<meta name="description" content={description || defaultDescription} />
	<link rel="canonical" href={canonicalUrl} />
	{#if isStaging}
		<meta name="robots" content="noindex, nofollow" />
	{/if}
	<meta property="og:title" content={title || siteName} />
	<meta property="og:description" content={description || defaultDescription} />
	<meta property="og:image" content={ogImage || defaultImage} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={siteName} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={ogImage || defaultImage} />
	{#if jsonLdString}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdScript}
	{/if}
</svelte:head>
