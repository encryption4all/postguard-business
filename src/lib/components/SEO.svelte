<script lang="ts">
	let {
		title = '',
		description = '',
		ogImage = '',
		ogType = 'website',
		canonical = ''
	} = $props();
	const siteName = 'PostGuard for Business';
	const defaultDescription =
		'PostGuard for Business offers enterprise-grade identity-based email signing and encryption for organizations.';
	const defaultImage = '/pg_logo.png';
</script>

<svelte:head>
	<title>{title ? `${title} | ${siteName}` : siteName}</title>
	<meta name="description" content={description || defaultDescription} />
	<meta property="og:title" content={title || siteName} />
	<meta property="og:description" content={description || defaultDescription} />
	<meta property="og:image" content={ogImage || defaultImage} />
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={siteName} />
	{#if canonical}<link rel="canonical" href={canonical} />{/if}
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>
