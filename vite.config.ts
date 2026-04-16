import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			// yivi-css has "main": "dist/yivi.min.css" which Vite 8 can't resolve as a JS import
			'@privacybydesign/yivi-css': '@privacybydesign/yivi-css/dist/yivi.css',
			// eventsource@1 (yivi-client dep) uses Node's util.inherits which breaks in browser.
			// Browsers have native EventSource, so stub the polyfill.
			eventsource: '/src/lib/stubs/eventsource.ts'
		}
	},
	server: {
		// HMR through nginx proxy on port 8080
		hmr: {
			clientPort: 8080
		},
		// File watching with polling for Docker on macOS
		watch: {
			usePolling: true,
			interval: 1000
		}
	},
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}', 'tests/unit/**/*.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
