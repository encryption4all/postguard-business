import { env } from '$env/dynamic/public';
import { isEnabled } from '$lib/feature-flags';

export const GET = () => {
	const siteUrl = env.PUBLIC_SITE_URL || 'https://business.postguard.eu';

	const pages = [
		{ path: '/', priority: '1.0', changefreq: 'weekly' },
		...(isEnabled('registration')
			? [{ path: '/register', priority: '0.8', changefreq: 'monthly' }]
			: []),
		...(isEnabled('pricingPage')
			? [{ path: '/pricing', priority: '0.8', changefreq: 'monthly' }]
			: [])
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url>
    <loc>${siteUrl}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
